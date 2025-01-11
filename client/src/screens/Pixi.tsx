import React, { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { defineHex, Grid, Orientation, hexToPoint } from 'honeycomb-grid';
import _ from 'lodash';
import { Progress } from '@/components/ui/progress';

const HexGrid: React.FC = () => {
  const pixiContainer = useRef<HTMLDivElement>(null);
  // Create refs to store the PIXI application and container
  const appRef = useRef<PIXI.Application | null>(null);
  const hexContainerRef = useRef<PIXI.Container | null>(null);

  // Use React state for the center hex (axial coordinates)
  // (These coordinates are in q, r space)
  const [centerHex, setCenterHex] = useState({ q: 0, r: 0 });

  const [progress, setProgress] = useState(0);

  // We'll store our helper functions in refs (optional, but useful if they use app/hexContainer)
  const repositionContainerRef = useRef<() => void>(() => {});
  const updateHexesInViewRef = useRef<() => void>(() => {});

  // Main effect for PIXI initialization and creating the grid.
  useEffect(() => {
    if (!pixiContainer.current) return;

    const app = new PIXI.Application();
    appRef.current = app;

    (async () => {
      await app.init({
        background: 0x1099bb,
        resizeTo: window,
        antialias: true,
        resolution: window.devicePixelRatio,
      });

      if (pixiContainer.current) {
        pixiContainer.current.appendChild(app.canvas as HTMLCanvasElement);
      }

      // Custom grid shape
      function bigNegativeToPositiveShape() {
        const coords = [];
        for (let q = -1000; q <= 1000; q++) {
          for (let r = -1000; r <= 1000; r++) {
            coords.push({ q, r });
          }
        }
        return coords;
      }

      // Constants
      const HEX_SIZE = 30;

      // Honeycomb setup
      const Hex = defineHex({
        dimensions: HEX_SIZE,
        orientation: Orientation.FLAT,
      });

      const grid = new Grid(Hex, bigNegativeToPositiveShape());

      // Create a container for the hexes and add it to the stage.
      const hexContainer = new PIXI.Container();
      hexContainerRef.current = hexContainer;
      app.stage.addChild(hexContainer);

      // We'll also store hexMap and visibleHexKeys in local scope in this effect:
      const hexMap = new Map<string, { container: PIXI.Container; hex: any }>();

      // Helper: Convert a center hex (q, r) to pixel coordinates
      const centerPixel = (hexCoord: { q: number; r: number }) => {
        // Note: new Hex(centerHex) converts the axial coordinate into a hex object.
        return hexToPoint(new Hex(hexCoord));
      };

      // Helper function: reposition the container so that the center tile stays at screen center.
      // This version uses pivot and sets container.position directly.
      const repositionContainer = () => {
        if (!appRef.current || !hexContainerRef.current) return;
        const screenCenter = {
          x: appRef.current.screen.width / window.devicePixelRatio / 2,
          y: appRef.current.screen.height / window.devicePixelRatio / 2,
        };
        // Calculate the pixel coordinate for the center tile.
        const centerPos = centerPixel(centerHex);
        // Set the container's pivot to the center tile's pixel coordinate.
        hexContainerRef.current.pivot.set(centerPos.x, centerPos.y);
        // Position the container such that the pivot (the center tile) is exactly at the screen center.
        hexContainerRef.current.position.set(screenCenter.x, screenCenter.y);
      };

      // Define updateHexesInView as in your code:
      function updateHexesInView() {
        if (!appRef.current || !hexContainerRef.current) return;

        const hexContainer = hexContainerRef.current;

        // Convert the screen's top-left and bottom-right to container's local coordinates
        const topLeft = hexContainer.toLocal({ x: 0, y: 0 });
        const bottomRight = hexContainer.toLocal({
          x: appRef.current.screen.width / window.devicePixelRatio,
          y: appRef.current.screen.height / window.devicePixelRatio,
        });

        // Compute the basic visible bounds
        const minX = Math.min(topLeft.x, bottomRight.x);
        const maxX = Math.max(topLeft.x, bottomRight.x);
        const minY = Math.min(topLeft.y, bottomRight.y);
        const maxY = Math.max(topLeft.y, bottomRight.y);

        // Add a margin (for example, to render one extra hex column/row on each side)
        const marginY = HEX_SIZE * 15;
        const marginX = HEX_SIZE * 24;
        const expandedMinX = minX - marginX;
        const expandedMaxX = maxX + marginX;
        const expandedMinY = minY - marginY;
        const expandedMaxY = maxY + marginY;

        // Keep track of which hexes should be visible
        const visibleHexKeys = new Set<string>();

        // Iterate over the entire grid (or a subset if you have an efficient way)
        // For every hex, check if its pixel coordinate (from hexToPoint) lies within the expanded bounds.
        for (const hex of grid) {
          const point = hexToPoint(hex); // these are in grid (or container) space
          const x = point.x;
          const y = point.y;

          if (
            x >= expandedMinX &&
            x <= expandedMaxX &&
            y >= expandedMinY &&
            y <= expandedMaxY
          ) {
            const key = `${hex.q},${hex.r}`;
            visibleHexKeys.add(key);

            // If this hex does not yet exist in our hexMap, create and add it.
            if (!hexMap.has(key)) {
              const container = createHexContainer(hex);
              hexMap.set(key, { container, hex });
              hexContainer.addChild(container);
            }
          }
        }

        // Now remove any hexes that are no longer visible.
        for (const [key, { container }] of hexMap.entries()) {
          if (!visibleHexKeys.has(key)) {
            hexContainer.removeChild(container);
            container.destroy({ children: true });
            hexMap.delete(key);
          }
        }
      }

      // Create a helper to build a hex container.
      function createHexContainer(hex: any): PIXI.Container {
        const hexAndTextContainer = new PIXI.Container();
        const point = hexToPoint(hex);
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
        drawHex(0x0000ff);
        graphics.eventMode = 'static';
        graphics.cursor = 'pointer';
        graphics.on('pointerover', () => drawHex(0xffff00));
        graphics.on('pointerout', () => drawHex(0x0000ff));
        const labelText = new PIXI.Text(`(${hex.q},${hex.r})`, {
          fill: 0xff0000,
          fontSize: 10,
          fontFamily: 'Arial',
          align: 'center',
        });
        labelText.anchor.set(0.5, 0.5);
        labelText.position.set(point.x, point.y);
        hexAndTextContainer.addChild(graphics);
        hexAndTextContainer.addChild(labelText);
        return hexAndTextContainer;
      }

      // Save our helper functions to refs so they can be used later.
      repositionContainerRef.current = repositionContainer;
      updateHexesInViewRef.current = updateHexesInView;

      // Set up interactivity (drag, zoom) and call updateHexesInView where needed.
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

      const debouncedUpdateHexesInView = _.debounce(updateHexesInView, 16);
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

      let scaleFactor = 1;
      function onWheel(e: WheelEvent) {
        e.preventDefault();

        // Update scale factor depending on zoom direction.
        scaleFactor *= e.deltaY < 0 ? 1.1 : 0.9;

        // Update the container pivot and position before changing scale.
        if (appRef.current && hexContainerRef.current) {
          const screenCenter = {
            x: appRef.current.screen.width / window.devicePixelRatio / 2,
            y: appRef.current.screen.height / window.devicePixelRatio / 2,
          };
          const centerPos = centerPixel(centerHex);
          hexContainerRef.current.pivot.set(centerPos.x, centerPos.y);
          hexContainerRef.current.position.set(screenCenter.x, screenCenter.y);
          hexContainerRef.current.scale.set(scaleFactor);
        }

        updateHexesInView();
      }

      app.canvas.addEventListener('wheel', onWheel, { passive: false });
      window.addEventListener('resize', updateHexesInView);

      // Initial positioning and update
      repositionContainer();
      updateHexesInView();

      return () => {
        app.canvas.removeEventListener('wheel', onWheel);
        window.removeEventListener('resize', updateHexesInView);
        app.destroy(true, { children: true });
      };
    })();
  }, []);

  // This effect will run when 'centerHex' changes.
  useEffect(() => {
    if (!appRef.current || !hexContainerRef.current) return;
    if (repositionContainerRef.current && updateHexesInViewRef.current) {
      repositionContainerRef.current();
      updateHexesInViewRef.current();
    }
  }, [centerHex]);

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
