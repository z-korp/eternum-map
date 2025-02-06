// hooks/useTiles.ts

import { useEffect, useState } from 'react';
import { useBackendTiles } from './useBackendTiles';
import { ParsedEntity } from '@dojoengine/sdk';
import { ChunkCoord, getRegionKey } from '../utils/chunkUtils';

/**
 * Interface representing tile data.
 */
interface TileData {
  col: number;
  row: number;
  realm?: Realm;
  resources: number[];
}

/**
 * Interface representing a Realm.
 * Adjust based on your actual Realm structure.
 */
interface Realm {
  realmId: number;
  realmName: string;
  coordinates: { x: number; y: number };
  resources: number[];
}

/**
 * Custom hook to manage tile data.
 */
export function useTiles() {
  const { loadDiscoveredTilesFromStorage } = useBackendTiles();
  const [tiles, setTiles] = useState<Map<string, TileData>>(new Map());

  // Load discovered tiles from localStorage on mount
  useEffect(() => {
    const discovered = loadDiscoveredTilesFromStorage();
    setTiles((prev) => {
      const newMap = new Map(prev);
      discovered.forEach((key) => {
        const [col, row] = key.split(',').map(Number);
        newMap.set(key, {
          col,
          row,
          realm: undefined, // Initialize without realm; update as needed
          resources: [],
        });
      });
      return newMap;
    });
  }, [loadDiscoveredTilesFromStorage]);

  /**
   * Updates a tile's data.
   * @param tile - The updated tile data.
   */
  const updateTile = (tile: TileData) => {
    setTiles((prev) => {
      const newMap = new Map(prev);
      const key = `${tile.col},${tile.row}`;
      newMap.set(key, tile);
      return newMap;
    });
  };

  /**
   * Parses an entity from the backend into TileData.
   * @param entity - The parsed entity.
   * @returns The tile data.
   */
  const parseTileData = (entity: ParsedEntity<any>): TileData => {
    return {
      col: Number(entity.data.col),
      row: Number(entity.data.row),
      realm: entity.data.realm, // Adjust based on actual data structure
      resources: entity.data.resources || [],
    };
  };

  return {
    tiles,
    setTiles,
    updateTile,
    parseTileData,
  };
}
