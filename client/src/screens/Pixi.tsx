import React, { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { defineHex, Grid, Orientation, hexToPoint } from 'honeycomb-grid';
import _ from 'lodash';
import { Progress } from '@/components/ui/progress';
import { Realm, useRealms } from '../hooks/useRealms';
import { preloadRcsImages } from '../utils/preloadRcsImages';

const HexGrid: React.FC = () => {
  const pixiContainer = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const hexContainerRef = useRef<PIXI.Container | null>(null);

  const { realms } = useRealms();
  const [centerHex, setCenterHex] = useState({ q: 185, r: 74 });
  const [progress, setProgress] = useState(0);
  const [rcsTextures, setRcsTextures] = useState<Record<
    string,
    PIXI.Texture
  > | null>(null);

  const [hoveredRealm, setHoveredRealm] = useState<Realm | null>(null);

  function handlePointerOver(realm: Realm) {
    setHoveredRealm(realm);
  }

  function handlePointerOut() {
    setHoveredRealm(null);
  }

  const rcsTexturesRef = useRef<Record<string, PIXI.Texture> | null>(null);
  const repositionContainerRef = useRef<() => void>(() => {});
  const updateHexesInViewRef = useRef<() => void>(() => {});
  const hexMapRef = useRef(
    new Map<string, { container: PIXI.Container; hex: any }>()
  );
  const realmsRef = useRef(realms);

  useEffect(() => {
    if (!pixiContainer.current) return;

    const app = new PIXI.Application();
    appRef.current = app;

    const initializePixi = async () => {
      // Preload your resource images
      const textures = await preloadRcsImages();
      setRcsTextures(textures);
      rcsTexturesRef.current = textures;

      await app.init({
        background: 0x1099bb,
        resizeTo: window,
        antialias: true,
        autoDensity: true,
        resolution: window.devicePixelRatio || 1,
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

      const centerPixel = (hexCoord: { q: number; r: number }) => {
        return hexToPoint(new Hex(hexCoord));
      };

      const repositionContainer = () => {
        if (!appRef.current || !hexContainerRef.current) return;

        const screenCenter = {
          x: appRef.current.screen.width / 2,
          y: appRef.current.screen.height / 2,
        };

        // Factor in the current scale of the hexContainer
        const scale = hexContainerRef.current.scale.x; // Assuming uniform scaling

        // Adjust the center pixel calculation to account for scale
        const centerPos = centerPixel(centerHex);
        hexContainerRef.current.pivot.set(centerPos.x, centerPos.y);
        hexContainerRef.current.position.set(
          screenCenter.x / scale,
          screenCenter.y / scale
        );
      };

      function updateHexesInView() {
        if (!appRef.current || !hexContainerRef.current) return;

        const hexContainer = hexContainerRef.current;
        const topLeft = hexContainer.toLocal({ x: 0, y: 0 });
        const bottomRight = hexContainer.toLocal({
          x: appRef.current.screen.width,
          y: appRef.current.screen.height,
        });

        const minX = Math.min(topLeft.x, bottomRight.x);
        const maxX = Math.max(topLeft.x, bottomRight.x);
        const minY = Math.min(topLeft.y, bottomRight.y);
        const maxY = Math.max(topLeft.y, bottomRight.y);

        // Margin for extra hexes
        const marginY = HEX_SIZE * 15;
        const marginX = HEX_SIZE * 24;
        const expandedMinX = minX - marginX;
        const expandedMaxX = maxX + marginX;
        const expandedMinY = minY - marginY;
        const expandedMaxY = maxY + marginY;

        const visibleHexKeys = new Set<string>();

        for (const hex of grid) {
          const point = hexToPoint(hex);
          if (
            point.x >= expandedMinX &&
            point.x <= expandedMaxX &&
            point.y >= expandedMinY &&
            point.y <= expandedMaxY
          ) {
            const key = `${hex.q},${hex.r}`;
            visibleHexKeys.add(key);

            // Check for a matching realm first.
            const realm = realmsRef.current.find(
              (realm) =>
                realm.coordinates.x === hex.q && realm.coordinates.y === hex.r
            );

            if (!hexMapRef.current.has(key)) {
              // Create a container that is already aware of the realm (if present)
              const container = createHexContainer(hex, realm);
              hexMapRef.current.set(key, { container, hex });
              hexContainer.addChild(container);
            } else {
              // Optionally, if the container already exists, update it if realm info is available.
              const { container } = hexMapRef.current.get(key)!;
              if (realm) {
                // You can either update the container's children or recreate it.
                // For simplicity, let’s re-create it:
                hexContainer.removeChild(container);
                container.destroy({ children: true });
                const updatedContainer = createHexContainer(hex, realm);
                hexMapRef.current.set(key, {
                  container: updatedContainer,
                  hex,
                });
                hexContainer.addChild(updatedContainer);
              }
            }
          }
        }

        // Remove hexes that are no longer visible.
        for (const [key, { container }] of hexMapRef.current.entries()) {
          if (!visibleHexKeys.has(key)) {
            hexContainer.removeChild(container);
            container.destroy({ children: true });
            hexMapRef.current.delete(key);
          }
        }
      }

      function createHexContainer(hex, realmOverride) {
        // Get the hex center (absolute pixel coordinates)
        const point = hexToPoint(hex);

        // Create a container and position it at the hex’s center.
        const hexAndTextContainer = new PIXI.Container();
        hexAndTextContainer.x = 0;
        hexAndTextContainer.y = 0;
        const graphics = new PIXI.Graphics();
        const realm =
          realmOverride ||
          realmsRef.current.find(
            (realm) =>
              realm.coordinates.x === hex.q && realm.coordinates.y === hex.r
          );

        if (realm) {
          graphics
            .poly(hex.corners)
            .fill(0xffd700)
            .stroke({ width: 1, color: 'black', alignment: 0.5 });
        } else {
          graphics
            .poly(hex.corners)
            .fill(0xffffff)
            .stroke({ width: 1, color: 'black', alignment: 0.5 });
        }

        // Add the hex polygon (drawn relative to 0,0 in the container).
        hexAndTextContainer.addChild(graphics);

        // Now add text and resource sprites if a realm exists.
        if (realm) {
          // Add text centered at (0,0) in the container.
          const labelText = new PIXI.Text(realm.realmName, {
            fill: 0x000000,
            fontSize: 10,
            fontFamily: 'Arial',
            align: 'center',
          });
          labelText.anchor.set(0.5);
          labelText.position.set(point.x, point.y);
          //hexAndTextContainer.addChild(labelText);

          // Use preloaded textures to create sprites for each resource.
          realm.resources.forEach((resourceId: number, index: number) => {
            const angleOffset = (0 * Math.PI) / 180; // 45 degrees in radians
            const angle =
              (index * 2 * Math.PI) / realm.resources.length + angleOffset;
            const radius = 16;
            // Choose an image filename based on resourceId or other logic.
            // For example, if resourceId is directly the filename:
            const filename = `${resourceId}.png`;

            // Make sure rcsTextures is available.
            const textureSource = rcsTexturesRef.current;
            console.log('textureSource', textureSource);
            if (textureSource && textureSource[filename]) {
              const resourceSprite = new PIXI.Sprite(textureSource[filename]);
              resourceSprite.anchor.set(0.5);
              resourceSprite.width = HEX_SIZE / 1.5;
              resourceSprite.height = HEX_SIZE / 1.5;
              resourceSprite.position.set(
                point.x + radius * Math.cos(angle),
                point.y + radius * Math.sin(angle)
              );
              hexAndTextContainer.addChild(resourceSprite);
            } else {
              console.error("Couldn't find texture for", filename);
            }
          });
        }

        // Setup simple pointer interactivity for the hex
        graphics.eventMode = 'static';
        graphics.cursor = 'pointer';
        graphics.on('pointerover', () => {
          handlePointerOver(realm);
          graphics.tint = 0xffff00;
        });
        graphics.on('pointerout', () => {
          graphics.tint = 0xffffff;
          handlePointerOut();
        });

        return hexAndTextContainer;
      }
      repositionContainerRef.current = repositionContainer;
      updateHexesInViewRef.current = updateHexesInView;

      let isDragging = false;
      let dragStartPos = { x: 0, y: 0 };
      let containerStartPos = { x: 0, y: 0 };
      hexContainer.eventMode = 'static';
      hexContainer.cursor = 'grab';

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
        _.debounce(updateHexesInView, 16)();
      });

      hexContainer.on('pointerup', () => {
        isDragging = false;
        hexContainer.cursor = 'grab';
      });
      hexContainer.on('pointerupoutside', () => {
        isDragging = false;
        hexContainer.cursor = 'grab';
      });

      let scaleFactor = 1;
      app.canvas.addEventListener('wheel', (e: WheelEvent) => {
        e.preventDefault();
        scaleFactor *= e.deltaY < 0 ? 1.1 : 0.9;
        hexContainer.scale.set(scaleFactor);
        updateHexesInView();
      });

      repositionContainer();
      updateHexesInView([]);
    };

    initializePixi();

    return () => {
      app.destroy(true, { children: true });
    };
  }, []);

  useEffect(() => {
    if (repositionContainerRef.current && updateHexesInViewRef.current) {
      repositionContainerRef.current();
      updateHexesInViewRef.current();
    }
  }, [centerHex]);

  useEffect(() => {
    realmsRef.current = realms;
    // Also trigger an update if needed:
    if (updateHexesInViewRef.current) {
      updateHexesInViewRef.current();
    }
  }, [realms]);

  return (
    <div className="relative w-screen h-screen">
      {hoveredRealm && (
        <div className="absolute top-4 right-4 bg-white p-4 shadow-lg rounded">
          <h4>{hoveredRealm.realmName}</h4>
          <p>
            Coordinates: ({hoveredRealm.coordinates.x},{' '}
            {hoveredRealm.coordinates.y})
          </p>
          <p>Resources: {hoveredRealm.resources.join(', ')}</p>
        </div>
      )}
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
      {/*progress < 100 && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 flex flex-col gap-2 bg-background/90 p-4 rounded-lg shadow-lg">
          <div className="text-center text-sm font-medium">
            Loading Hex Grid... {Math.round(progress)}%
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      )*/}
    </div>
  );
};

export default HexGrid;
