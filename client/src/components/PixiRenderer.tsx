// components/PixiRenderer.tsx
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { usePixiApp } from '../hooks/usePixiApp';
import { useHexGrid } from '../hooks/useHexGrid';
import { useVisibleBounds } from '../hooks/useVisibleBounds';
import { useInteractions } from '../hooks/useInteractions';
import { useTiles } from '../hooks/useTiles';
import { useTilesStore } from '../stores/useTilesStore';
import { hexToPoint } from 'honeycomb-grid';
import { preloadRcsImages } from '../utils/preloadRcsImages';
import * as PIXI from 'pixi.js';
import _ from 'lodash';
import { Realm } from '../types';
import HexRenderer from './HexRenderer';
import { calculateVisibleChunks, isTileWithinChunks } from '../utils/gridUtils';

interface PixiRendererProps {
  centerHex: { col: number; row: number };
  realms: Realm[];
  onRealmHover: (realm: Realm | null) => void;
}

const PixiRenderer: React.FC<PixiRendererProps> = ({
  centerHex,
  realms,
  onRealmHover,
}) => {
  const pixiContainer = useRef<HTMLDivElement>(null);
  const hexContainerRef = useRef<PIXI.Container | null>(null);
  const appRef = usePixiApp(pixiContainer);
  const hexMapRef = useRef(
    new Map<string, { container: PIXI.Container; hex: any }>()
  );
  const realmsRef = useRef(realms);
  const centerHexRef = useRef(centerHex);
  const [rcsTextures, setRcsTextures] = useState<Record<
    string,
    PIXI.Texture
  > | null>(null);
  const rcsTexturesRef = useRef<Record<string, PIXI.Texture> | null>(null);

  // Get hex grid configuration
  const { grid, hex: myHex, HEX_SIZE } = useHexGrid();

  const gridRef = useRef(grid);

  useEffect(() => {
    gridRef.current = grid;
  }, [grid]);

  // Track visible area
  const { boundingBox, updateBoundingBox } = useVisibleBounds(
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

  useEffect(() => {
    realmsRef.current = realms;
  }, [realms]);

  useEffect(() => {
    centerHexRef.current = centerHex;
    if (repositionContainerRef.current) {
      repositionContainerRef.current();
      updateHexesInViewRef.current?.();
    }
  }, [centerHex]);

  // Helper for positioning
  const centerPixel = useCallback(
    (hexCoord: { col: number; row: number }) => {
      return hexToPoint(new myHex(hexCoord));
    },
    [myHex]
  );

  // Functions for container positioning and hex updates
  const repositionContainerRef = useRef<() => void>(() => {});
  const updateHexesInViewRef = useRef<() => void>(() => {});

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
      hexContainer.hitArea = new PIXI.Rectangle(-2000, -2000, 4000, 4000);
      hexContainer.eventMode = 'static';
      hexContainer.cursor = 'grab';
      hexContainerRef.current = hexContainer;
      app.stage.addChild(hexContainer);

      // Set up hex rendering functions - implement these in HexRenderer
      const hexRenderer = new HexRenderer(
        myHex,
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

        // Process discovered tiles
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

        // Process realm tiles
        hexRenderer.updateVisibleRealmHexes(grid, appRef.current, HEX_SIZE);
      };

      // Store references to functions
      repositionContainerRef.current = repositionContainer;
      updateHexesInViewRef.current = updateHexesInView;

      // Initial positioning and rendering
      repositionContainer();
      updateHexesInView();
    };

    initializeHexGrid();
  }, [appRef, centerPixel, grid, myHex, HEX_SIZE, onRealmHover]);

  // Set up interaction handlers
  useInteractions(hexContainerRef, appRef, updateBoundingBox, () =>
    updateHexesInViewRef.current?.()
  );

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
