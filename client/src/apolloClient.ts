import { ApolloClient, InMemoryCache } from '@apollo/client';

const client = new ApolloClient({
  uri: 'https://api.cartridge.gg/x/eternum-prod/torii/graphql',
  cache: new InMemoryCache(),
});

export default client;
