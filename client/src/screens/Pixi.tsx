import React, { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { defineHex, Grid, Orientation, hexToPoint } from 'honeycomb-grid';
import _ from 'lodash';
import { Progress } from '@/components/ui/progress';
import { Realm, useRealms } from '../hooks/useRealms';
import { preloadRcsImages } from '../utils/preloadRcsImages';
import SearchMenu from '../components/SearchMenu';
import { Card } from '../components/ui/card';

const HexGrid: React.FC = () => {
  const pixiContainer = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const hexContainerRef = useRef<PIXI.Container | null>(null);

  const { realms } = useRealms();
  const [centerHex, setCenterHex] = useState({ q: -28, r: -14 });
  const [progress, setProgress] = useState(0);
  const [rcsTextures, setRcsTextures] = useState<Record<
    string,
    PIXI.Texture
  > | null>(null);

  const containerRealmMap = new WeakMap<PIXI.Container, Realm>();

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
        background: 0xffffff,
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

      const debouncedUpdateHexesInView = _.debounce(() => {
        if (updateHexesInViewRef.current) {
          updateHexesInViewRef.current();
        }
      }, 16);

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

        const marginY = HEX_SIZE * 15;
        const marginX = HEX_SIZE * 24;
        const expandedMinX = minX - marginX;
        const expandedMaxX = maxX + marginX;
        const expandedMinY = minY - marginY;
        const expandedMaxY = maxY + marginY;

        const visibleHexKeys = new Set<string>();

        // Collect all visible hexes first
        const visibleHexes: Array<{
          hex: any;
          key: string;
          realm: Realm | undefined;
          point: { x: number; y: number };
        }> = [];

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

            const realm = realmsRef.current.find(
              (realm) =>
                realm.coordinates.x === hex.q && realm.coordinates.y === hex.r
            );

            visibleHexes.push({ hex, key, realm, point });
          }
        }

        // Sort hexes: non-realm hexes first, then realm hexes
        // This ensures realm borders are drawn on top
        visibleHexes.sort((a, b) => {
          if (!!a.realm === !!b.realm) return 0;
          return a.realm ? 1 : -1;
        });

        // Now process the sorted hexes
        for (const { hex, key, realm } of visibleHexes) {
          if (!hexMapRef.current.has(key)) {
            const container = createHexContainer(hex, realm);
            if (realm) {
              containerRealmMap.set(container, realm);
            }
            hexMapRef.current.set(key, { container, hex });
            hexContainer.addChild(container);
          } else {
            const { container } = hexMapRef.current.get(key)!;
            const existingRealm = containerRealmMap.get(container);
            const realmChanged =
              existingRealm?.realmId !== realm?.realmId ||
              (existingRealm === undefined && realm !== undefined) ||
              (existingRealm !== undefined && realm === undefined);

            if (realmChanged) {
              updateHexContainer(container, hex, realm);
              if (realm) {
                containerRealmMap.set(container, realm);
              } else {
                containerRealmMap.delete(container);
              }

              // Re-order container to maintain layer order
              hexContainer.removeChild(container);
              hexContainer.addChild(container);
            }
          }
        }

        // Remove hexes that are no longer visible
        for (const [key, { container }] of hexMapRef.current.entries()) {
          if (!visibleHexKeys.has(key)) {
            hexContainer.removeChild(container);
            containerRealmMap.delete(container);
            container.destroy({ children: true });
            hexMapRef.current.delete(key);
          }
        }
      }

      function createHexContainer(hex: any, realmOverride: Realm) {
        const point = hexToPoint(hex);
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
            .stroke({ width: 2, color: 0x000000, alignment: 0.5 }); // Centered 2px black border
        } else {
          graphics
            .poly(hex.corners)
            .fill(0xffffff)
            .stroke({ width: 1, color: 0xd3d3d3, alignment: 1 }); // Inner 1px gray border
        }

        hexAndTextContainer.addChild(graphics);

        // Handle resource sprites
        if (realm) {
          realm.resources.forEach((resourceId: number, index: number) => {
            const angleOffset = (0 * Math.PI) / 180;
            const angle =
              (index * 2 * Math.PI) / realm.resources.length + angleOffset;
            const radius = 16;
            const filename = `${resourceId}.png`;

            const textureSource = rcsTexturesRef.current;
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
            }
          });
        }

        // Setup pointer interactivity
        graphics.eventMode = 'static';
        graphics.cursor = 'pointer';

        const updateHoverState = (isOver: boolean) => {
          if (isOver) {
            graphics.tint = 0xffff00;
            if (realm) {
              handlePointerOver(realm);
            }
          } else {
            graphics.tint = 0xffffff;
            handlePointerOut();
          }
        };

        graphics.on('pointerover', () => updateHoverState(true));
        graphics.on('pointerout', () => updateHoverState(false));

        return hexAndTextContainer;
      }

      function updateHexContainer(
        container: PIXI.Container,
        hex: any,
        realm: Realm
      ) {
        const graphics = container.getChildAt(0) as PIXI.Graphics;
        const point = hexToPoint(hex);

        // Update the graphics
        graphics.clear();
        if (realm) {
          graphics
            .poly(hex.corners)
            .fill(0xffd700)
            .stroke({ width: 2, color: 0x000000, alignment: 0.5 }); // Centered 2px black border
        } else {
          graphics
            .poly(hex.corners)
            .fill(0xffffff)
            .stroke({ width: 1, color: 0xd3d3d3, alignment: 1 }); // Inner 1px gray border
        }

        // Remove all children except the graphics
        while (container.children.length > 1) {
          container.removeChildAt(1);
        }

        // Update hover handlers
        graphics.removeAllListeners();
        graphics.eventMode = 'static';
        graphics.cursor = 'pointer';

        const updateHoverState = (isOver: boolean) => {
          if (isOver) {
            graphics.tint = 0xffff00;
            if (realm) {
              handlePointerOver(realm);
            }
          } else {
            graphics.tint = 0xffffff;
            handlePointerOut();
          }
        };

        graphics.on('pointerover', () => updateHoverState(true));
        graphics.on('pointerout', () => updateHoverState(false));

        // Add resource sprites
        if (realm && rcsTexturesRef.current) {
          realm.resources.forEach((resourceId, index) => {
            const angleOffset = (0 * Math.PI) / 180;
            const angle =
              (index * 2 * Math.PI) / realm.resources.length + angleOffset;
            const radius = 16;
            const filename = `${resourceId}.png`;

            if (rcsTexturesRef.current[filename]) {
              const resourceSprite = new PIXI.Sprite(
                rcsTexturesRef.current[filename]
              );
              resourceSprite.anchor.set(0.5);
              resourceSprite.width = HEX_SIZE / 1.5;
              resourceSprite.height = HEX_SIZE / 1.5;
              resourceSprite.position.set(
                point.x + radius * Math.cos(angle),
                point.y + radius * Math.sin(angle)
              );
              container.addChild(resourceSprite);
            }
          });
        }

        return container;
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

        debouncedUpdateHexesInView();
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

        const screenCenter = {
          x: app.screen.width / 2,
          y: app.screen.height / 2,
        };

        const worldPos = hexContainer.toLocal(screenCenter);
        scaleFactor *= e.deltaY < 0 ? 1.1 : 0.9;
        hexContainer.scale.set(scaleFactor);

        const newScreenPos = hexContainer.toGlobal(worldPos);
        const dx = screenCenter.x - newScreenPos.x;
        const dy = screenCenter.y - newScreenPos.y;
        hexContainer.x += dx;
        hexContainer.y += dy;

        // Use the same debounced function
        debouncedUpdateHexesInView();
      });

      repositionContainer();
      updateHexesInView();
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
        <Card className="fixed top-4 right-4 w-64 shadow-lg p-4">
          <h4>{hoveredRealm.realmName}</h4>
          <p>
            Coordinates: ({hoveredRealm.coordinates.x},{' '}
            {hoveredRealm.coordinates.y})
          </p>
          <p>
            Position: ({hoveredRealm.position.q}, {hoveredRealm.position.r})
          </p>
          <p>Resources: {hoveredRealm.resources.join(', ')}</p>
        </Card>
      )}
      <SearchMenu
        realms={realms}
        onRealmSelect={(realm) => console.log(realm)}
        onPositionSelect={(p) => {
          setCenterHex({ q: p.x, r: p.y });
        }}
      />
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
