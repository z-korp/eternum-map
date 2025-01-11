import { gql } from '@apollo/client';

// Query to fetch army models with pagination
export const ARMY_MODELS_QUERY = gql`
  query S0EternumArmyModels($first: Int, $after: String) {
    s0EternumSettleRealmDataModels(first: $first, after: $after) {
      edges {
        node {
          entity_id
          realm_name
          produced_resources
          x
          y
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

// Query to fetch realm models with pagination
export const REALM_MODELS_QUERY = gql`
  query S0EternumRealmModels($first: Int, $after: String) {
    s0EternumRealmModels(first: $first, after: $after) {
      edges {
        node {
          entity_id
          realm_id
          produced_resources
          has_wonder
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

// Query to fetch settle realm data with pagination
export const SETTLE_REALM_DATA_QUERY = gql`
  query S0EternumSettleRealmDataModels($first: Int, $after: String) {
    s0EternumSettleRealmDataModels(first: $first, after: $after) {
      edges {
        node {
          entity_id
          x
          y
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;
