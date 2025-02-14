import { useState, useEffect } from 'react';
import { useApolloClient } from '@apollo/client';
import { REALM_MODELS_QUERY, SETTLE_REALM_DATA_QUERY } from '../queries';
import realmsJson from '../../public/assets/jsons/realms.json';
import { unpackResources } from '../ui/utils/packedData';

export interface Realm {
  id: string;
  realmId: string;
  realmName: string;
  resources: number[];
  hasWonder: boolean;
  coordinates: { x: number; y: number } | null;
  position: { q: number; r: number } | null;
}

export interface RealmsJson {
  [key: string]: {
    name: string;
    description: string;
    image: string;
    attributes: {
      trait_type: string;
      value: string | number;
    }[];
  };
}

function offsetToAxial(x: number, y: number): { q: number; r: number } {
  const q = x - Math.floor((y - (y % 2)) / 2);
  const r = y;
  return { q, r };
}

const realmsData: RealmsJson = realmsJson as RealmsJson;

export const useRealms = () => {
  const client = useApolloClient();
  const [realms, setRealms] = useState<Realm[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchAllPaginated = async (query: any, batchSize: number) => {
      let allData: any[] = [];
      let hasNextPage = true;
      let after: string | null = null;

      while (hasNextPage) {
        const { data } = await client.query({
          query,
          variables: { first: batchSize, after },
        });

        const edges =
          data.s1EternumSettleRealmDataModels?.edges ||
          data.s1EternumRealmModels?.edges;
        allData = allData.concat(edges);

        hasNextPage =
          data.s1EternumSettleRealmDataModels?.pageInfo?.hasNextPage ||
          data.s1EternumRealmModels?.pageInfo?.hasNextPage;
        after =
          data.s1EternumSettleRealmDataModels?.pageInfo?.endCursor ||
          data.s1EternumRealmModels?.pageInfo?.endCursor;
      }

      return allData;
    };

    const fetchRealms = async () => {
      try {
        setLoading(true);

        // Fetch all REALM_MODELS in batches
        const realmModels = await fetchAllPaginated(REALM_MODELS_QUERY, 500);

        // Fetch all SETTLE_REALM_DATA in batches
        const settleRealmData = await fetchAllPaginated(
          SETTLE_REALM_DATA_QUERY,
          500
        );

        // Create a map for coordinates using entity_id
        const coordinatesMap = new Map(
          settleRealmData.map((edge: any) => [
            edge.node.entity_id,
            { x: edge.node.x, y: edge.node.y },
          ])
        );

        // Combine data from both queries
        const combinedRealms = realmModels.map((edge: any) => {
          const node = edge.node;
          const coordinates = coordinatesMap.get(node.entity_id) || null;

          const normalizedCoord = coordinates
            ? {
                x: coordinates.x - 2147483647,
                y: coordinates.y - 2147483647,
              }
            : null;

          return {
            id: node.entity_id,
            realmId: node.realm_id,
            realmName: realmsData[node.realm_id]?.name || 'Unknown Realm',
            resources: unpackResources(node.produced_resources),
            hasWonder: node.has_wonder,
            coordinates: normalizedCoord,
            position: normalizedCoord
              ? offsetToAxial(normalizedCoord.x, normalizedCoord.y)
              : null,
          };
        });

        setRealms(combinedRealms);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchRealms();
  }, [client]);

  useEffect(() => {
    // when realms change, update the localStorage cache (not yet)
    // when realms change, compute the bounding box of the map

    const boundingBox = realms.reduce(
      (acc, realm) => {
        if (!realm.position) return acc;

        acc.minQ = Math.min(acc.minQ, realm.position.q);
        acc.maxQ = Math.max(acc.maxQ, realm.position.q);
        acc.minR = Math.min(acc.minR, realm.position.r);
        acc.maxR = Math.max(acc.maxR, realm.position.r);

        return acc;
      },
      {
        minQ: Infinity,
        maxQ: -Infinity,
        minR: Infinity,
        maxR: -Infinity,
      }
    );

    console.log('boundingBox', boundingBox);
  }, [realms]);

  return { realms, loading, error };
};
