import { useQuery } from '@apollo/client';
import { S1_ETERNUUM_ARMY_MODELS_QUERY } from '../queries';

export const useArmies = () => {
  const { loading, error, data } = useQuery(S1_ETERNUUM_ARMY_MODELS_QUERY);

  // Transform or prepare the data if needed
  const armies = data?.s1EternumSettleRealmDataModels.edges.map(({ node }) => ({
    id: node.entity_id,
    realmName: node.realm_name,
    resources: node.produced_resources,
    coordinates: { x: node.x, y: node.y },
  }));

  return { loading, error, armies };
};
