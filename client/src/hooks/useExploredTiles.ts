import { useRef, useEffect, useCallback, useMemo } from 'react';
import _ from 'lodash';
import { useDojo } from '../dojo/useDojo';
import { getEntities } from '@dojoengine/state';
import { useComponentValue, useEntityQuery } from '@dojoengine/react';
import { Has } from '@dojoengine/recs';

interface FetchTilesProps {
  startCol: number;
  endCol: number;
  startRow: number;
  endRow: number;
  range?: number; // Optional, with a default value
}

interface ExploredTile {
  col: number;
  row: number;
  resources: number[];
}

export const useExploredTiles = () => {
  const {
    setup: {
      network: { toriiClient, contractComponents },
    },
  } = useDojo();

  const fetchedTilesRef = useRef<Map<string, ExploredTile>>(new Map());

  const clause = {
    Composite: {
      operator: 'And',
      clauses: [
        {
          Member: {
            model: 's0_eternum-Tile',
            member: 'col',
            operator: 'Gte',
            value: { Primitive: { U32: startCol - range } },
          },
        },
        {
          Member: {
            model: 's0_eternum-Tile',
            member: 'col',
            operator: 'Lte',
            value: { Primitive: { U32: endCol + range } },
          },
        },
        {
          Member: {
            model: 's0_eternum-Tile',
            member: 'row',
            operator: 'Gte',
            value: { Primitive: { U32: startRow - range } },
          },
        },
        {
          Member: {
            model: 's0_eternum-Tile',
            member: 'row',
            operator: 'Lte',
            value: { Primitive: { U32: endRow + range } },
          },
        },
      ],
    },
  };

  const tileKeys = useEntityQuery([Has(contractComponents.Tile)]);

  const component = useComponentValue(Chest, key);
  const tile = useMemo(() => {
    return component;
  }, [component]);

  const fetchTiles = useCallback(
    async ({
      startCol,
      endCol,
      startRow,
      endRow,
      range = 1,
    }: FetchTilesProps) => {
      try {
        const sub = await getEntities(
          toriiClient,
          clause,
          contractComponents,
          [],
          ['s0_eternum-Tile'],
          1000,
          true
        );

        console.log('Fetched tiles:', sub);

        const fetchedTiles = new Map<string, ExploredTile>();
        sub.forEach((tile: any) => {
          const key = `${tile.col},${tile.row}`;
          fetchedTiles.set(key, tile);
        });

        // Update the reference to cache fetched tiles
        fetchedTilesRef.current = fetchedTiles;
        return fetchedTiles;
      } catch (error) {
        console.error('Error fetching tiles:', error);
        return new Map<string, ExploredTile>();
      }
    },
    [toriiClient, contractComponents]
  );

  // Expose the tiles and fetch function
  return { fetchTiles, fetchedTiles: fetchedTilesRef.current };
};
