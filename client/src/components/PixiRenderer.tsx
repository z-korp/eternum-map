// components/PixiRenderer.tsx
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { usePixiApp } from '../hooks/usePixiApp';
import { useHexGrid } from '../hooks/useHexGrid';
import { useVisibleBounds } from '../hooks/useVisibleBounds';
import { useInteractions } from '../hooks/useInteractions';
import { useTiles } from '../hooks/useTiles';
import { useTilesStore } from '../stores/useTilesStore';
import { Hex, hexToPoint } from 'honeycomb-grid';
import { preloadRcsImages } from '../utils/preloadRcsImages';
import * as PIXI from 'pixi.js';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import _ from 'lodash';
import { Realm } from '../types';
import HexRenderer from './HexRenderer';
import { calculateVisibleChunks, isTileWithinChunks } from '../utils/gridUtils';

interface PixiRendererProps {
  centerHex: { col: number; row: number };
  realms: Realm[];
  onRealmHover: (realm: Realm | null) => void;
  showTiles?: boolean;
}

const PixiRenderer: React.FC<PixiRendererProps> = ({
  centerHex,
  realms,
  onRealmHover,
  showTiles = true,
}) => {
  const pixiContainer = useRef<HTMLDivElement>(null);
  const hexContainerRef = useRef<PIXI.Container | null>(null);
  const appRef = usePixiApp(pixiContainer);
  const hexMapRef = useRef(
    new Map<string, { container: PIXI.Container; hex: Hex }>()
  );
  const realmsRef = useRef(realms);
  const prevRealmsRef = useRef<Realm[]>([]);
  const centerHexRef = useRef(centerHex);
  const showTilesRef = useRef(showTiles);
  const [, setRcsTextures] = useState<Record<string, PIXI.Texture> | null>(
    null
  );
  const rcsTexturesRef = useRef<Record<string, PIXI.Texture> | null>(null);

  // Get hex grid configuration
  const { grid, hex: myHex, HEX_SIZE } = useHexGrid();

  const gridRef = useRef(grid);

  useEffect(() => {
    gridRef.current = grid;
  }, [grid]);

  // Track visible area
  const { boundingBox, updateBoundingBox } = useVisibleBounds(
    centerHex,
    hexContainerRef,
    appRef,
    gridRef
  );

  // Load tiles data based on visible area
  useTiles(boundingBox);
  const { tiles: discoveredTiles } = useTilesStore();
  const discoveredTilesRef = useRef(discoveredTiles);

  useEffect(() => {
    discoveredTilesRef.current = discoveredTiles;
  }, [discoveredTiles]);

  // Add a separate effect for showTiles changes
  useEffect(() => {
    console.log('showTiles changed:', showTiles);
    showTilesRef.current = showTiles;

    // Trigger tile visibility update when showTiles changes
    if (updateHexesInViewRef.current) {
      updateHexesInViewRef.current();
    }
  }, [showTiles]);

  // Update realmsRef when realms change and trigger re-render
  useEffect(() => {
    // Store the previous realms before updating
    prevRealmsRef.current = realmsRef.current;
    realmsRef.current = realms;

    console.log('realms changed');

    // This is the key part - we need to clear existing realm hexes and re-render
    if (updateHexesInViewRef.current && hexContainerRef.current) {
      // Find realms that were in the previous list but not in the current list
      const removedRealms = prevRealmsRef.current.filter(
        (prevRealm) =>
          !realms.some(
            (currentRealm) =>
              currentRealm.coordinates.x === prevRealm.coordinates.x &&
              currentRealm.coordinates.y === prevRealm.coordinates.y
          )
      );

      // Clear removed realm hexes
      removedRealms.forEach((removedRealm) => {
        const key = `${removedRealm.coordinates.x},${removedRealm.coordinates.y}`;
        const hexData = hexMapRef.current.get(key);

        if (hexData) {
          // Remove from container
          hexContainerRef.current?.removeChild(hexData.container);
          // Remove from map
          hexMapRef.current.delete(key);
        }
      });

      // Now re-render to add any new realms
      updateHexesInViewRef.current();
    }
  }, [realms]);

  // Functions for container positioning and hex updates
  const repositionContainerRef = useRef<() => void>(() => {});
  const updateHexesInViewRef = useRef<() => void>(() => {});
  const updateHitAreaRef = useRef<() => void>(() => {});

  useEffect(() => {
    centerHexRef.current = centerHex;
    if (repositionContainerRef.current) {
      repositionContainerRef.current();
      updateHexesInViewRef.current?.();
      updateHitAreaRef.current?.();
    }
  }, [centerHex]);

  useEffect(() => {
    if (updateHexesInViewRef.current && discoveredTiles.length > 0) {
      updateHexesInViewRef.current();
    }
  }, [discoveredTiles]);

  // Helper for positioning
  const centerPixel = useCallback(
    (hexCoord: { col: number; row: number }) => {
      return hexToPoint(new myHex(hexCoord));
    },
    [myHex]
  );

  // Set up hex rendering and interaction
  useEffect(() => {
    if (!appRef.current || !pixiContainer.current || !grid) return;

    const app = appRef.current;

    const initializeHexGrid = async () => {
      // Preload resource images
      const textures = await preloadRcsImages();
      setRcsTextures(textures);
      rcsTexturesRef.current = textures;

      // Create a container for the hexes
      const hexContainer = new PIXI.Container();
      // Make the initial hit area much larger
      hexContainer.hitArea = new PIXI.Rectangle(-10000, -10000, 20000, 20000);
      hexContainer.eventMode = 'static';
      hexContainer.cursor = 'grab';
      hexContainerRef.current = hexContainer;
      app.stage.addChild(hexContainer);

      // Set up hex rendering functions - implement these in HexRenderer
      const hexRenderer = new HexRenderer(
        hexContainer,
        hexMapRef,
        rcsTexturesRef,
        realmsRef,
        onRealmHover,
        HEX_SIZE
      );

      // Function to position the container based on center hex
      const repositionContainer = () => {
        if (!appRef.current || !hexContainerRef.current) return;

        const screenCenter = {
          x: appRef.current.screen.width / 2,
          y: appRef.current.screen.height / 2,
        };

        const centerPos = centerPixel(centerHexRef.current);

        hexContainerRef.current.pivot.set(centerPos.x, centerPos.y);
        hexContainerRef.current.position.set(screenCenter.x, screenCenter.y);
      };

      // Function to update visible hexes
      const updateHexesInView = () => {
        if (!appRef.current || !hexContainerRef.current) return;

        // Always use the current value from the ref
        const shouldShowTiles = showTilesRef.current;

        // Process discovered tiles if they should be shown
        if (shouldShowTiles) {
          console.log('Showing tiles');
          const visibleChunks = calculateVisibleChunks(
            appRef.current,
            hexContainerRef.current,
            HEX_SIZE
          );

          discoveredTilesRef.current.forEach((tile) => {
            if (isTileWithinChunks(tile.col, tile.row, visibleChunks)) {
              const key = `${tile.col},${tile.row}`;
              if (!hexMapRef.current.has(key)) {
                const hex = new myHex({ col: tile.col, row: tile.row });
                const container = hexRenderer.createHexDiscoveredContainer(
                  hex,
                  tile.color
                );
                hexMapRef.current.set(key, { container, hex });
                hexContainer.addChild(container);
              }
            }
          });
        } else {
          console.log('Hiding tiles');
          // If tiles shouldn't be shown, remove any existing tile hexes
          const tilesToRemove: string[] = [];

          hexMapRef.current.forEach((value, key) => {
            // Check if this is a tile hex (not a realm hex)
            const [col, row] = key.split(',').map(Number);
            const isRealm = realmsRef.current.some(
              (r) => r.coordinates.x === col && r.coordinates.y === row
            );

            if (!isRealm) {
              // Remove from container
              hexContainerRef.current?.removeChild(value.container);
              // Store keys to remove after iteration
              tilesToRemove.push(key);
            }
          });

          // Remove from map after iteration
          tilesToRemove.forEach((key) => {
            hexMapRef.current.delete(key);
          });
        }

        // Process realm tiles (these are always shown)
        hexRenderer.updateVisibleRealmHexes(grid, appRef.current, HEX_SIZE);
      };

      // Add a function to update the hit area
      const updateHitArea = () => {
        if (!appRef.current || !hexContainerRef.current) return;

        // Get the current view bounds in world coordinates
        const topLeft = hexContainerRef.current.toLocal({ x: 0, y: 0 });
        const bottomRight = hexContainerRef.current.toLocal({
          x: appRef.current.screen.width,
          y: appRef.current.screen.height,
        });

        // Calculate width and height with padding
        const padding = 5000; // Large padding to ensure we can drag far
        const minX = Math.min(topLeft.x, bottomRight.x) - padding;
        const maxX = Math.max(topLeft.x, bottomRight.x) + padding;
        const minY = Math.min(topLeft.y, bottomRight.y) - padding;
        const maxY = Math.max(topLeft.y, bottomRight.y) + padding;

        // Update the hit area
        hexContainerRef.current.hitArea = new PIXI.Rectangle(
          minX,
          minY,
          maxX - minX,
          maxY - minY
        );
      };

      // Store references to functions
      repositionContainerRef.current = repositionContainer;
      updateHexesInViewRef.current = updateHexesInView;
      updateHitAreaRef.current = updateHitArea;

      // Initial positioning and rendering
      repositionContainer();
      updateHexesInView();
      updateHitArea();
    };

    initializeHexGrid();
  }, [appRef, centerPixel, grid, myHex, HEX_SIZE, onRealmHover]);

  // Set up interaction handlers
  useInteractions(hexContainerRef, appRef, updateBoundingBox, () => {
    updateHexesInViewRef.current?.();
    updateHitAreaRef.current?.();
  });

  return (
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
  );
};

export default PixiRenderer;
