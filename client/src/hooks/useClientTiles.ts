// useClientTiles.ts

import { useMemo } from 'react';
import { getComponentValue, Has } from '@dojoengine/recs';
import { useEntityQuery } from '@dojoengine/react';
import { useDojo } from '../dojo/useDojo';

export const useClientTiles = () => {
  const {
    setup: {
      components: { Tile },
    },
  } = useDojo();

  // This query returns entity keys for all entities that have the Tile component.
  const tileKeys = useEntityQuery([Has(Tile)]);

  // Convert the array of keys to tile data
  const tiles = useMemo(() => {
    return tileKeys.map((key) => {
      const tile = getComponentValue(Tile, key);
      // tile might be { col, row, explored, resources, etc. }
      return tile;
    });
  }, [tileKeys, Tile]);

  /**
   * Filter out any null/undefined tiles.
   * You can also filter out unexplored tiles if you want only "discovered" ones:
   *    .filter(tile => tile?.explored)
   */
  const validTiles = useMemo(
    () => tiles.filter((t) => t !== undefined && t !== null),
    [tiles]
  );

  return validTiles;
};
