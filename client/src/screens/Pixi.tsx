// components/HexGrid.tsx

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as PIXI from 'pixi.js';
import { defineHex, Orientation, hexToPoint, Grid } from 'honeycomb-grid';
import _ from 'lodash';

import { Card } from '../components/ui/card';
import SearchMenu from '../components/SearchMenu';

import {
  getChunkCoord,
  getRegionKey,
  ChunkCoord,
  CHUNK_SIZE,
} from '../utils/chunk';
import { preloadRcsImages } from '../utils/preloadRcsImages';
import { Realm, useRealms } from '../hooks/useRealms';
import { useTiles } from '../hooks/useTiles';
import { useTilesStore } from '../stores/useTilesStore';
import { color } from 'framer-motion';

const HexGrid: React.FC = () => {
  const pixiContainer = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const hexContainerRef = useRef<PIXI.Container | null>(null);

  const { realms } = useRealms();
  const [centerHex, setCenterHex] = useState({ col: -1, row: -26 });
  const [rcsTextures, setRcsTextures] = useState<Record<
    string,
    PIXI.Texture
  > | null>(null);
  const [boundingBox, setBoundingBox] = useState({
    startCol: 0,
    endCol: 0,
    startRow: 0,
    endRow: 0,
  });

  const memoizedBoundingBox = React.useMemo(
    () => boundingBox,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      boundingBox.startCol,
      boundingBox.endCol,
      boundingBox.startRow,
      boundingBox.endRow,
    ]
  );

  const debouncedSetBoundingBox = useMemo(() => {
    return _.debounce((newBox: any) => {
      setBoundingBox(newBox);
    }, 50); // 50ms delay, adjust as needed
  }, [setBoundingBox]);

  // Clean up the debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSetBoundingBox.cancel();
    };
  }, [debouncedSetBoundingBox]);

  useTiles(memoizedBoundingBox);
  const { tiles: discoveredTiles } = useTilesStore();
  const discoveredTilesRef = useRef(discoveredTiles);

  useEffect(() => {
    console.log(discoveredTiles);
    discoveredTilesRef.current = discoveredTiles;
  }, [discoveredTiles]);

  const containerRealmMap = new WeakMap<PIXI.Container, Realm>();

  const [hoveredRealm, setHoveredRealm] = useState<Realm | null>(null);

  function handlePointerOver(realm: Realm) {
    setHoveredRealm(realm);
  }

  function handlePointerOut() {
    setHoveredRealm(null);
  }

  const centerHexRef = useRef(centerHex);
  const rcsTexturesRef = useRef<Record<string, PIXI.Texture> | null>(null);
  const repositionContainerRef = useRef<() => void>(() => {});
  const updateHexesInViewRef = useRef<() => void>(() => {});
  const hexMapRef = useRef(
    new Map<string, { container: PIXI.Container; hex: any }>()
  );
  const realmsRef = useRef(realms);

  useEffect(() => {
    centerHexRef.current = centerHex;
    if (repositionContainerRef.current && updateHexesInViewRef.current) {
      repositionContainerRef.current();
      updateHexesInViewRef.current();
    }
  }, [centerHex]);

  const hexGridRef = useRef<Grid<any> | null>(null);

  const HEX_SIZE = 30;
  const myHex = defineHex({
    dimensions: HEX_SIZE,
    orientation: Orientation.POINTY,
    offset: -1,
  });

  useEffect(() => {
    if (!hexGridRef.current) {
      // Precompute a large shape (avoid recreating this)
      function bigNegativeToPositiveShape() {
        const coords = [];
        for (let col = -1000; col <= 1000; col++) {
          for (let row = -1000; row <= 1000; row++) {
            coords.push({ col, row });
          }
        }
        return coords;
      }

      hexGridRef.current = new Grid(myHex, bigNegativeToPositiveShape());
    }
  }, []);

  // Function to calculate visible chunks plus a margin
  const calculateVisibleChunks = useCallback((): ChunkCoord[] => {
    if (!appRef.current || !hexContainerRef.current) return [];

    const hexContainer = hexContainerRef.current;
    const topLeft = hexContainer.toLocal({ x: 0, y: 0 });
    const bottomRight = hexContainer.toLocal({
      x: appRef.current.screen.width,
      y: appRef.current.screen.height,
    });

    const HEX_SIZE = 30;
    const bufferChunks = 2; // Number of chunks to preload around the viewport

    // Approximate hex to pixel calculations for chunk determination
    const approxHexWidth = HEX_SIZE * 1.5; // Width of a hex in pixels
    const approxHexHeight = HEX_SIZE * Math.sqrt(3); // Height of a hex in pixels

    // Calculate the range of columns and rows visible
    const minCol =
      Math.floor(topLeft.x / (CHUNK_SIZE * approxHexWidth)) - bufferChunks;
    const maxCol =
      Math.floor(bottomRight.x / (CHUNK_SIZE * approxHexWidth)) + bufferChunks;
    const minRow =
      Math.floor(topLeft.y / (CHUNK_SIZE * approxHexHeight)) - bufferChunks;
    const maxRow =
      Math.floor(bottomRight.y / (CHUNK_SIZE * approxHexHeight)) + bufferChunks;

    const chunks = new Set<string>();
    for (let col = minCol; col <= maxCol; col++) {
      for (let row = minRow; row <= maxRow; row++) {
        const chunk = getChunkCoord(col, row);
        const key = getRegionKey(chunk);
        chunks.add(key);
      }
    }

    const chunkCoords: ChunkCoord[] = Array.from(chunks).map((key) => {
      const [x, y] = key.split(',').map(Number);
      return { x, y };
    });

    return chunkCoords;
  }, []);

  // Function to check if a tile is within visible chunks
  const isTileWithinChunks = (
    col: number,
    row: number,
    chunks: ChunkCoord[]
  ): boolean => {
    return chunks.some((chunk) => {
      return (
        col >= chunk.x * CHUNK_SIZE &&
        col < (chunk.x + 1) * CHUNK_SIZE &&
        row >= chunk.y * CHUNK_SIZE &&
        row < (chunk.y + 1) * CHUNK_SIZE
      );
    });
  };

  const updateBoundingBox = () => {
    if (!hexContainerRef.current || !appRef.current || !hexGridRef.current)
      return;

    const grid = hexGridRef.current;

    // Convert the screen corners to world coordinates (in pixels)
    const topLeft = hexContainerRef.current.toLocal({ x: 0, y: 0 });
    const bottomRight = hexContainerRef.current.toLocal({
      x: appRef.current.screen.width,
      y: appRef.current.screen.height,
    });
    const topRight = hexContainerRef.current.toLocal({
      x: appRef.current.screen.width,
      y: 0,
    });
    const bottomLeft = hexContainerRef.current.toLocal({
      x: 0,
      y: appRef.current.screen.height,
    });

    // Convert pixel coordinates to hex grid coordinates
    const topLeftHex = grid.pointToHex(topLeft, { allowOutside: false });
    const topRightHex = grid.pointToHex(topRight, { allowOutside: false });
    const bottomLeftHex = grid.pointToHex(bottomLeft, { allowOutside: false });
    const bottomRightHex = grid.pointToHex(bottomRight, {
      allowOutside: false,
    });
    const cols = [
      topLeftHex.col,
      topRightHex.col,
      bottomLeftHex.col,
      bottomRightHex.col,
    ];
    const rows = [
      topLeftHex.row,
      topRightHex.row,
      bottomLeftHex.row,
      bottomRightHex.row,
    ];

    const newBoundingBox = {
      startCol: Math.floor(Math.min(...cols)),
      endCol: Math.ceil(Math.max(...cols)),
      startRow: Math.floor(Math.min(...rows)),
      endRow: Math.ceil(Math.max(...rows)),
    };

    debouncedSetBoundingBox(newBoundingBox);
  };

  // Initialize PIXI application and setup
  useEffect(() => {
    if (!pixiContainer.current || !hexGridRef.current) return;

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
      const grid = new Grid(myHex, bigNegativeToPositiveShape());

      // Create a container for the hexes and add it to the stage.
      const hexContainer = new PIXI.Container();
      // Define a large rectangle that covers your expected map area.
      hexContainer.hitArea = new PIXI.Rectangle(-2000, -2000, 4000, 4000);
      hexContainer.interactive = true;
      hexContainer.cursor = 'grab';
      hexContainerRef.current = hexContainer;
      app.stage.addChild(hexContainer);

      const centerPixel = (hexCoord: { col: number; row: number }) => {
        return hexToPoint(new myHex(hexCoord));
      };

      const debouncedUpdateHexesInView = _.debounce(() => {
        if (updateHexesInViewRef.current) {
          updateHexesInViewRef.current();
        }
      }, 16); // ~60fps

      const repositionContainer = () => {
        if (!appRef.current || !hexContainerRef.current) return;

        const screenCenter = {
          x: appRef.current.screen.width / 2,
          y: appRef.current.screen.height / 2,
        };

        const centerPos = centerPixel(centerHex);

        hexContainerRef.current.pivot.set(centerPos.x, centerPos.y);
        hexContainerRef.current.position.set(screenCenter.x, screenCenter.y);
      };

      const updateHexesInView = () => {
        if (!appRef.current || !hexContainerRef.current) return;
        const app = appRef.current;
        const hexContainer = hexContainerRef.current;

        // ---------------------------------------------------------------------------
        // STEP 1: Process Discovered Tiles
        // ---------------------------------------------------------------------------
        const visibleChunks = calculateVisibleChunks();
        discoveredTilesRef.current.forEach((tile) => {
          const key = `${tile.col},${tile.row}`;
          // Only process if the tile is within a visible chunk.
          if (isTileWithinChunks(tile.col, tile.row, visibleChunks)) {
            if (!hexMapRef.current.has(key)) {
              console.log('Creating discovered tile:', key);
              const hex = new myHex({ col: tile.col, row: tile.row });
              const container = createHexDiscoveredContainer(hex, tile.color);
              hexMapRef.current.set(key, { container, hex });
              hexContainer.addChild(container);
            }
          }
        });

        // ---------------------------------------------------------------------------
        // STEP 2: Process Tiles with a Realm (Skip empty tiles)
        // ---------------------------------------------------------------------------
        // Determine the visible world bounds (with margins)
        const topLeft = hexContainer.toLocal({ x: 0, y: 0 });
        const bottomRight = hexContainer.toLocal({
          x: app.screen.width,
          y: app.screen.height,
        });
        const minX = Math.min(topLeft.x, bottomRight.x);
        const maxX = Math.max(topLeft.x, bottomRight.x);
        const minY = Math.min(topLeft.y, bottomRight.y);
        const maxY = Math.max(topLeft.y, bottomRight.y);
        const marginX = HEX_SIZE * 24;
        const marginY = HEX_SIZE * 15;
        const expandedMinX = minX - marginX;
        const expandedMaxX = maxX + marginX;
        const expandedMinY = minY - marginY;
        const expandedMaxY = maxY + marginY;

        // Gather only those hexes whose center is within the expanded bounds.
        // We then filter for those that have a realm.
        const visibleRealmHexes = [];
        const visibleKeys = new Set();
        for (const hex of grid) {
          const point = hexToPoint(hex);
          if (
            point.x >= expandedMinX &&
            point.x <= expandedMaxX &&
            point.y >= expandedMinY &&
            point.y <= expandedMaxY
          ) {
            const key = `${hex.col},${hex.row}`;
            visibleKeys.add(key);

            const realm = realmsRef.current.find(
              (r) => r.coordinates.x === hex.col && r.coordinates.y === hex.row
            );
            // Only process tiles that have a realm.
            if (realm) {
              visibleRealmHexes.push({ hex, key, realm, point });
            }
          }
        }
        console.log('visibleRealmHexes:', visibleRealmHexes);

        // (Optional) Sort so realm tiles are drawn on top if needed.
        visibleRealmHexes.sort((a, b) => (a.realm ? 1 : -1));

        // Create or update containers for realm tiles.
        visibleRealmHexes.forEach(({ hex, key, realm }) => {
          if (!hexMapRef.current.has(key)) {
            const container = createHexContainer(hex, realm, false);
            containerRealmMap.set(container, realm);
            hexMapRef.current.set(key, { container, hex });
            hexContainer.addChild(container);
          } else {
            const { container } = hexMapRef.current.get(key);
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
              // Reorder container so that realm borders display on top.
              hexContainer.removeChild(container);
              hexContainer.addChild(container);
            }
          }
        });

        // ---------------------------------------------------------------------------
        // STEP 3: Clean Up - Remove Containers Not Within Visible Bounds
        // ---------------------------------------------------------------------------
        // This cleanup applies to both discovered and realm tiles.
        hexMapRef.current.forEach((value, key) => {
          if (!visibleKeys.has(key)) {
            hexContainer.removeChild(value.container);
            containerRealmMap.delete(value.container);
            value.container.destroy({ children: true });
            hexMapRef.current.delete(key);
          }
        });
      };

      function createHexDiscoveredContainer(hex: any, color: string) {
        const hexAndTextContainer = new PIXI.Container();
        hexAndTextContainer.x = 0;
        hexAndTextContainer.y = 0;

        const graphics = new PIXI.Graphics();

        graphics
          .poly(hex.corners)
          .fill(color)
          .stroke({ width: 1, color: 0xd3d3d3, alignment: 1 }); // Inner 1px gray border

        hexAndTextContainer.addChild(graphics);

        return hexAndTextContainer;
      }

      function createHexContainer(
        hex: any,
        realmOverride: Realm | undefined,
        displayText = false
      ) {
        const point = hexToPoint(hex);
        const hexAndTextContainer = new PIXI.Container();
        hexAndTextContainer.x = 0;
        hexAndTextContainer.y = 0;

        const graphics = new PIXI.Graphics();
        const realm =
          realmOverride ||
          realmsRef.current.find(
            (realm) =>
              realm?.coordinates?.x === hex.col &&
              realm?.coordinates?.y === hex.row
          );

        if (realm) {
          graphics
            .poly(hex.corners)
            .fill(0xffd700)
            .stroke({ width: 2, color: 0x000000, alignment: 0.5 }); // Centered 2px black border
        } else {
          graphics
            .poly(hex.corners)
            .fill(0xffffff, 0)
            .stroke({ width: 1, color: 0xd3d3d3, alignment: 1 }); // Inner 1px gray border
        }

        hexAndTextContainer.addChild(graphics);

        // *** Debug Text: Show hex coordinates ***
        if (displayText) {
          const debugText = new PIXI.Text(`(${hex.col},${hex.row})`, {
            fill: 0x000000,
            fontSize: 10,
            fontFamily: 'Arial',
          });
          // Center the text in the hex
          debugText.anchor.set(0.5);
          // Position the text at the center of the hex tile
          debugText.position.set(point.x, point.y);
          // Optionally, name it so you can find it later if needed
          debugText.name = 'debugText';
          hexAndTextContainer.addChild(debugText);
        }

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
        realm: Realm | undefined
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

      // Initial positioning and rendering
      repositionContainer();
      updateHexesInView();

      // Set up event listeners for panning and zooming
      let isDragging = false;
      let dragStartPos = { x: 0, y: 0 };
      let containerStartPos = { x: 0, y: 0 };

      hexContainer.interactive = true;
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

        updateBoundingBox();

        debouncedUpdateHexesInView();
      });

      const endDrag = () => {
        isDragging = false;
        hexContainer.cursor = 'grab';
      };

      hexContainer.on('pointerup', endDrag);
      hexContainer.on('pointerupoutside', endDrag);

      // Zooming
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

        updateBoundingBox();

        debouncedUpdateHexesInView();
      });

      repositionContainer();
      updateHexesInView();
    };

    initializePixi();

    return () => {
      app.destroy(true, { children: true });
      window.removeEventListener('resize', repositionContainerRef.current);
    };
  }, []);

  // Reposition and update view when centerHex changes
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
  }, [realms, discoveredTiles]);

  return (
    <div className="relative w-screen h-screen">
      {hoveredRealm && (
        <Card className="fixed top-4 right-4 w-64 shadow-lg p-4">
          <h4>{hoveredRealm.realmName}</h4>
          <p>
            Coordinates: ({hoveredRealm.coordinates.x},{' '}
            {hoveredRealm.coordinates.y})
          </p>
          <p>Resources: {hoveredRealm.resources.join(', ')}</p>
        </Card>
      )}
      <SearchMenu
        realms={realms}
        onRealmSelect={(realm) => console.log(realm)}
        onPositionSelect={(p) => setCenterHex({ col: p.x, row: p.y })}
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
    </div>
  );
};

export default HexGrid;
