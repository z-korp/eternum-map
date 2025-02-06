// hooks/useBackendTiles.ts

import { useCallback, useRef } from 'react';
import { getEntities } from '@dojoengine/state';
import { useDojo } from '../dojo/useDojo';
import { getRegionKey, ChunkCoord, CHUNK_SIZE } from '../utils/chunk';

interface FetchParams {
  chunkX: number;
  chunkY: number;
  range?: number; // Number of chunks to expand in each direction
}

/** Key used in localStorage for discovered tile coords */
const DISCOVERED_TILES_KEY = 'discovered_tiles';

export const useBackendTiles = () => {
  const {
    setup: {
      network: { toriiClient, contractComponents },
    },
  } = useDojo();

  // Track fetched chunks to prevent redundant fetches
  const fetchedChunksRef = useRef<Set<string>>(new Set());

  // Load and save discovered tiles from/to localStorage
  const loadDiscoveredTilesFromStorage = useCallback((): Set<string> => {
    try {
      const json = localStorage.getItem(DISCOVERED_TILES_KEY);
      if (!json) return new Set();
      return new Set(JSON.parse(json));
    } catch (e) {
      return new Set();
    }
  }, []);

  const saveDiscoveredTilesToStorage = useCallback((tiles: Set<string>) => {
    localStorage.setItem(
      DISCOVERED_TILES_KEY,
      JSON.stringify(Array.from(tiles))
    );
  }, []);

  const addDiscoveredTileToStorage = useCallback(
    (col: number, row: number) => {
      const discovered = loadDiscoveredTilesFromStorage();
      discovered.add(`${col},${row}`);
      saveDiscoveredTilesToStorage(discovered);
    },
    [loadDiscoveredTilesFromStorage, saveDiscoveredTilesToStorage]
  );

  /**
   * Fetch tiles for a specific chunk and its surrounding chunks based on range.
   */
  const fetchTilesFromBackend = useCallback(
    async ({ chunkX, chunkY, range = 1 }: FetchParams) => {
      // Determine the range of chunks to fetch
      const chunksToFetch: ChunkCoord[] = [];
      for (let dx = -range; dx <= range; dx++) {
        for (let dy = -range; dy <= range; dy++) {
          const coord: ChunkCoord = { x: chunkX + dx, y: chunkY + dy };
          const key = getRegionKey(coord);
          if (!fetchedChunksRef.current.has(key)) {
            chunksToFetch.push(coord);
            fetchedChunksRef.current.add(key); // Mark as fetched
          }
        }
      }

      // Fetch data for all chunks that haven't been fetched yet
      const fetchPromises = chunksToFetch.map(async (chunk) => {
        const { x, y } = chunk;
        const startCol = x * CHUNK_SIZE;
        const endCol = (x + 1) * CHUNK_SIZE - 1;
        const startRow = y * CHUNK_SIZE;
        const endRow = (y + 1) * CHUNK_SIZE - 1;

        try {
          const entities = await getEntities(
            toriiClient,
            {
              Composite: {
                operator: 'And',
                clauses: [
                  {
                    Member: {
                      model: 's0_eternum-Tile',
                      member: 'col',
                      operator: 'Gte',
                      value: { Primitive: { U32: startCol } },
                    },
                  },
                  {
                    Member: {
                      model: 's0_eternum-Tile',
                      member: 'col',
                      operator: 'Lte',
                      value: { Primitive: { U32: endCol } },
                    },
                  },
                  {
                    Member: {
                      model: 's0_eternum-Tile',
                      member: 'row',
                      operator: 'Gte',
                      value: { Primitive: { U32: startRow } },
                    },
                  },
                  {
                    Member: {
                      model: 's0_eternum-Tile',
                      member: 'row',
                      operator: 'Lte',
                      value: { Primitive: { U32: endRow } },
                    },
                  },
                ],
              },
            },
            contractComponents,
            [],
            ['s0_eternum-Tile'],
            1000,
            true
          );

          // Process fetched entities
          entities.forEach((entity) => {
            const col = Number(entity.data.col);
            const row = Number(entity.data.row);
            addDiscoveredTileToStorage(col, row);
            // Here, you'd typically update your state/store with the tile data
            // This can be handled in a separate hook or state management system
          });
        } catch (error) {
          console.error('Error fetching tiles for chunk:', chunk, error);
        }
      });

      // Await all fetches
      await Promise.all(fetchPromises);
    },
    [toriiClient, contractComponents, addDiscoveredTileToStorage]
  );

  return {
    fetchTilesFromBackend,
    addDiscoveredTileToStorage,
    loadDiscoveredTilesFromStorage,
  };
};
