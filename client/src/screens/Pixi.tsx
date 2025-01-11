import React, { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { defineHex, Grid, Orientation, rectangle } from 'honeycomb-grid';
import _ from 'lodash';
import { Progress } from '@/components/ui/progress';

const HexGrid: React.FC = () => {
  const pixiContainer = useRef<HTMLDivElement>(null);

  // You might not need the progress bar if you’re creating hexes on-demand
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!pixiContainer.current) return;

    // Create your Pixi Application (basic version)
    const app = new PIXI.Application();

    /**
     *  We wrap all the logic in an async IIFE so we can await app.init(...)
     */
    (async () => {
      // Now we actually call our custom init, which sets up app.canvas.
      await app.init({
        background: 0x1099bb,
        resizeTo: window,
        antialias: true,
        resolution: window.devicePixelRatio,
      });

      // Only now that app.init() is done do we have app.canvas defined:
      if (pixiContainer.current) {
        pixiContainer.current.appendChild(app.canvas as HTMLCanvasElement);
      }

      // ──────────────────────────────────────────────────────────────────────────
      // From here on, everything is basically the same “on-demand creation” logic
      // ──────────────────────────────────────────────────────────────────────────

      // Constants
      const HEX_SIZE = 20;
      const GRID_WIDTH = 1000;
      const GRID_HEIGHT = 1000;

      // Honeycomb setup
      const Hex = defineHex({
        dimensions: HEX_SIZE,
        orientation: Orientation.FLAT,
      });
      const grid = new Grid(
        Hex,
        rectangle({ width: GRID_WIDTH, height: GRID_HEIGHT })
      );

      // Container that holds all hex objects
      const hexContainer = new PIXI.Container();
      app.stage.addChild(hexContainer);

      // We'll store references to created hexes here:
      // Key: "q,r" => Value: { container: PIXI.Container; hex: any }
      const hexMap = new Map<string, { container: PIXI.Container; hex: any }>();

      /**
       *  Create a single hex (a Container with a Graphics and optional Text).
       */
      function createHexContainer(hex: any): PIXI.Container {
        const hexAndTextContainer = new PIXI.Container();
        // Position the container at the hex’s world coords
        hexAndTextContainer.x = 0;
        hexAndTextContainer.y = 0;

        const graphics = new PIXI.Graphics();

        function drawHex(color: number) {
          graphics.clear();
          graphics
            .poly(hex.corners)
            .fill(color)
            .stroke({ width: 1, color: 'white', alignment: 0.5 });
        }
        drawHex(0x0000ff); // "blue"

        // Interactivity for this hex
        graphics.eventMode = 'static';
        graphics.cursor = 'pointer';
        graphics.on('pointerover', () => drawHex(0xffff00)); // "yellow"
        graphics.on('pointerout', () => drawHex(0x0000ff)); // "blue"

        // Optional text
        const labelText = new PIXI.Text(`(${hex.q},${hex.r})`, {
          fill: 0xff0000,
          fontSize: 10,
          fontFamily: 'Arial',
          align: 'center',
        });
        labelText.anchor.set(0.5, 0.5);
        labelText.position.set(hex.x, hex.y);

        // Add them to the container
        hexAndTextContainer.addChild(graphics);
        hexAndTextContainer.addChild(labelText);

        return hexAndTextContainer;
      }

      /**
       *  Checks which hexes are in the visible area (in container coordinates)
       *  Creates new ones if needed, removes old ones that left the view.
       */
      function updateHexesInView() {
        // Convert screen corners to "hexContainer" local coords
        const topLeft = hexContainer.toLocal({ x: 0, y: 0 });
        const bottomRight = hexContainer.toLocal({
          x: app.screen.width,
          y: app.screen.height,
        });

        const minX = Math.min(topLeft.x, bottomRight.x);
        const maxX = Math.max(topLeft.x, bottomRight.x);
        const minY = Math.min(topLeft.y, bottomRight.y);
        const maxY = Math.max(topLeft.y, bottomRight.y);

        // Keep track of which hexes *should* be visible
        const visibleHexKeys = new Set<string>();

        // In a real app, you'd want something more efficient than scanning all 1M hexes.
        // But for demonstration, this is straightforward.
        for (const hex of grid) {
          if (
            hex.x >= minX &&
            hex.x <= maxX &&
            hex.y >= minY &&
            hex.y <= maxY
          ) {
            const key = `${hex.q},${hex.r}`;
            visibleHexKeys.add(key);

            if (!hexMap.has(key)) {
              // create the container for this hex
              const c = createHexContainer(hex);
              hexMap.set(key, { container: c, hex });
              hexContainer.addChild(c);
            }
          }
        }

        // Remove hexes not in the visible set
        for (const [key, { container }] of hexMap) {
          if (!visibleHexKeys.has(key)) {
            hexContainer.removeChild(container);
            container.destroy({ children: true });
            hexMap.delete(key);
          }
        }

        console.log(`Currently in view: ${hexMap.size} hexes`);
      }

      // Use a small debounce so we're not overcalling updateHexesInView
      const debouncedUpdateHexesInView = _.debounce(updateHexesInView, 16);

      // Basic interactivity
      hexContainer.eventMode = 'static';
      hexContainer.cursor = 'grab';

      let isDragging = false;
      let dragStartPos = { x: 0, y: 0 };
      let containerStartPos = { x: 0, y: 0 };

      hexContainer.on('pointerdown', (e: PIXI.FederatedPointerEvent) => {
        isDragging = true;
        hexContainer.cursor = 'grabbing';
        dragStartPos = { x: e.global.x, y: e.global.y };
        containerStartPos = { x: hexContainer.x, y: hexContainer.y };
      });

      hexContainer.on('pointermove', (e: PIXI.FederatedPointerEvent) => {
        if (!isDragging) return;
        const dx = e.global.x - dragStartPos.x;
        const dy = e.global.y - dragStartPos.y;
        hexContainer.x = containerStartPos.x + dx;
        hexContainer.y = containerStartPos.y + dy;
        debouncedUpdateHexesInView();
      });

      const stopDrag = () => {
        isDragging = false;
        hexContainer.cursor = 'grab';
      };
      hexContainer.on('pointerup', stopDrag);
      hexContainer.on('pointerupoutside', stopDrag);

      // Zoom handling
      let scaleFactor = 1;
      function onWheel(e: WheelEvent) {
        e.preventDefault();
        if (e.deltaY < 0) {
          scaleFactor *= 1.1;
        } else {
          scaleFactor *= 0.9;
        }
        hexContainer.scale.set(scaleFactor);
        debouncedUpdateHexesInView();
      }
      app.canvas.addEventListener('wheel', onWheel, { passive: false });

      // Listen for window resizing
      window.addEventListener('resize', debouncedUpdateHexesInView);

      // Finally, do an initial call
      updateHexesInView();

      // Cleanup function for effect
      // We'll return a cleanup so React knows how to tear down
      return () => {
        app.canvas.removeEventListener('wheel', onWheel);
        window.removeEventListener('resize', debouncedUpdateHexesInView);
        app.destroy(true, { children: true });
      };
    })(); // end of the async IIFE
  }, []);

  // If you’re truly doing on-demand creation, you might not need a progress bar at all,
  // but here it is in case you still want it:
  return (
    <div className="relative w-screen h-screen">
      <div
        ref={pixiContainer}
        style={{
          width: '100%',
          height: '100%',
          margin: 0,
          padding: 0,
          overflow: 'hidden',
        }}
      />
      {progress < 100 && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 flex flex-col gap-2 bg-background/90 p-4 rounded-lg shadow-lg">
          <div className="text-center text-sm font-medium">
            Loading Hex Grid... {Math.round(progress)}%
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      )}
    </div>
  );
};

export default HexGrid;
