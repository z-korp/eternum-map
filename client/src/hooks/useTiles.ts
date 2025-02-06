// src/hooks/useTiles.ts

import { useEffect, useState, useCallback, useRef } from 'react';
import { Subscription } from '@dojoengine/torii-client';
import {
  ParsedEntity,
  ToriiQueryBuilder,
  ClauseBuilder,
} from '@dojoengine/sdk';
import { useDojo } from '../dojo/useDojo';
import { Tile, useTilesStore } from '../stores/useTilesStore';

/**
 * Converts a raw ParsedEntity to a Tile object.
 */
export function parseTile(entity: any): Tile | null {
  const tile = entity.models.s1_eternum.Tile;
  if (!tile) return null;

  const { col, row } = tile;
  if (typeof col !== 'number' || typeof row !== 'number') {
    console.warn('Invalid tile data:', entity);
    return null;
  }
  return { col: col - 2147483647, row: row - 2147483647 };
}

interface UseTilesParams {
  startCol: number;
  endCol: number;
  startRow: number;
  endRow: number;
  subscribe?: boolean;
}

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

  // Access store actions from Zustand.
  const { setTiles, addOrUpdateTile } = useTilesStore();
  const [localTiles, setLocalTiles] = useState<Tile[]>([]);
  const subscriptionRef = useRef<Subscription | null>(null);

  const buildTileQuery = useCallback(() => {
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
              startCol + 2147483647
            ),
            new ClauseBuilder().where(model, 'col', 'Lte', endCol + 2147483647),
            new ClauseBuilder().where(
              model,
              'row',
              'Gte',
              startRow + 2147483647
            ),
            new ClauseBuilder().where(model, 'row', 'Lte', endRow + 2147483647),
          ])
          .build()
      )
      .build();
  }, [startCol, endCol, startRow, endRow]);

  const fetchHistoricalTiles = useCallback(async () => {
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
      setTiles(parsedTiles); // Store in global Zustand state
      setLocalTiles(parsedTiles);
    } catch (error) {
      console.error('Error fetching tiles:', error);
      setTiles([]);
      setLocalTiles([]);
    }
  }, [buildTileQuery, sdk, setTiles]);

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
          ({
            data,
            error,
          }: {
            data: ParsedEntity<any> | null;
            error: Error | null;
          }) => {
            if (error) {
              console.error('Tile subscription error:', error);
              return;
            }
            if (data) {
              console.log('New or updated tile received:', data);
              const parsedTile = parseTile(data);
              if (parsedTile) {
                addOrUpdateTile(parsedTile);
                // Also update local state if needed
                setLocalTiles((prevTiles) => {
                  const index = prevTiles.findIndex(
                    (tile) =>
                      tile.col === parsedTile.col && tile.row === parsedTile.row
                  );
                  if (index !== -1) {
                    const updatedTiles = [...prevTiles];
                    updatedTiles[index] = parsedTile;
                    return updatedTiles;
                  } else {
                    return [...prevTiles, parsedTile];
                  }
                });
              }
            }
          }
        );

        return subscription as Subscription;
      } catch (error) {
        console.error('Error subscribing to tile updates:', error);
        return null;
      }
    }, [sdk, addOrUpdateTile]);

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

  // Return tiles from the global store (or localTiles if preferred)
  // Here, we return the global state so that other components (e.g., PIXI) can access it.
  const { tiles: storedTiles } = useTilesStore();
  return storedTiles;
}
