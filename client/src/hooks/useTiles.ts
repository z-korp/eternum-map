import { useEffect, useCallback, useRef } from 'react';
import { Subscription } from '@dojoengine/torii-client';
import {
  ParsedEntity,
  ToriiQueryBuilder,
  ClauseBuilder,
} from '@dojoengine/sdk';
import { useDojo } from '../dojo/useDojo';
import { Tile, useTilesStore } from '../stores/useTilesStore';
import { BIOME_COLORS } from '../types/biomes';
import { BiomeType } from '@bibliothecadao/eternum';

const TILE_OFFSET = 2147483647; // Extracted constant for clarity

/**
 * Converts a raw ParsedEntity to a Tile object.
 */
export function parseTile(entity: ParsedEntity<any>): Tile | null {
  const tile = entity.models.s1_eternum.Tile;
  if (!tile) return null;

  const { col, row, biome } = tile;
  if (typeof col !== 'number' || typeof row !== 'number') {
    console.warn('Invalid tile data:', entity);
    return null;
  }
  return {
    col: col - TILE_OFFSET,
    row: row - TILE_OFFSET,
    biome,
    color: BIOME_COLORS[biome as BiomeType],
  };
}

interface UseTilesParams {
  startCol: number;
  endCol: number;
  startRow: number;
  endRow: number;
  subscribe?: boolean;
}

/**
 * Fetches and subscribes to tile updates based on the provided bounding box.
 *
 * Returns the tiles stored in the global Zustand store.
 */
export function useTiles({
  startCol,
  endCol,
  startRow,
  endRow,
  subscribe = false,
}: UseTilesParams): Tile[] {
  const {
    setup: { sdk },
  } = useDojo();

  // Access global store actions from Zustand.
  const { setTiles, addOrUpdateTile, tiles: storedTiles } = useTilesStore();

  // Ref to hold the subscription (if any).
  const subscriptionRef = useRef<Subscription | null>(null);

  // Build the tile query with bounding box adjustments.
  const buildTileQuery = useCallback((): any => {
    const model = 's1_eternum-Tile';
    return new ToriiQueryBuilder()
      .withClause(
        new ClauseBuilder()
          .compose()
          .and([
            new ClauseBuilder().where(
              model,
              'col',
              'Gte',
              startCol + TILE_OFFSET
            ),
            new ClauseBuilder().where(
              model,
              'col',
              'Lte',
              endCol + TILE_OFFSET
            ),
            new ClauseBuilder().where(
              model,
              'row',
              'Gte',
              startRow + TILE_OFFSET
            ),
            new ClauseBuilder().where(
              model,
              'row',
              'Lte',
              endRow + TILE_OFFSET
            ),
          ])
          .build()
      )
      .withLimit(1000)
      .build();
  }, [startCol, endCol, startRow, endRow]);

  // Fetch historical tiles once when parameters or sdk changes.
  const fetchHistoricalTiles = useCallback(async (): Promise<void> => {
    if (!sdk) {
      console.warn('SDK not initialized. Skipping tile fetching.');
      return;
    }

    try {
      const query = buildTileQuery();
      console.log('Historical tile query:', query);
      const rawTiles: ParsedEntity<any>[] = await sdk.getEntities(query);
      console.log('Historical rawTiles:', rawTiles);

      const parsedTiles: Tile[] = rawTiles
        .map((entity) => parseTile(entity))
        .filter((tile): tile is Tile => tile !== null);

      console.log('Historical parsedTiles:', parsedTiles);
      // Update the global store.
      setTiles(parsedTiles);
    } catch (error) {
      console.error('Error fetching tiles:', error);
      setTiles([]);
    }
  }, [buildTileQuery, sdk, setTiles]);

  // Subscribe to tile updates if desired.
  const subscribeToTileUpdates =
    useCallback(async (): Promise<Subscription | null> => {
      if (!sdk) {
        console.warn('SDK not initialized. Skipping tile subscription.');
        return null;
      }

      try {
        const query = new ToriiQueryBuilder()
          .withEntityModels(['s1_eternum-Tile'])
          .build();

        const [initialData, subscription] = await sdk.subscribeEntities(
          query,
          (response) => {
            if (response.error) {
              console.error('Tile subscription error:', response.error);
              return;
            }

            if (response.data) {
              // Handle both single entity and array of entities
              const entities = Array.isArray(response.data)
                ? response.data
                : [response.data];

              entities.forEach((entity) => {
                console.log('New or updated tile received:', entity);
                const parsedTile = parseTile(entity);
                if (parsedTile) {
                  addOrUpdateTile(parsedTile);
                }
              });
            }
          }
        );

        return subscription as Subscription;
      } catch (error) {
        console.error('Error subscribing to tile updates:', error);
        return null;
      }
    }, [sdk, addOrUpdateTile]);

  // Effect: Fetch historical tiles and set up subscription if requested.
  useEffect(() => {
    fetchHistoricalTiles();

    if (subscribe) {
      subscribeToTileUpdates().then((sub) => {
        if (sub) {
          subscriptionRef.current = sub;
        }
      });
    }

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.free();
        subscriptionRef.current = null;
      }
    };
  }, [fetchHistoricalTiles, subscribe, subscribeToTileUpdates]);

  // Return the tiles from the global Zustand store.
  return storedTiles;
}
