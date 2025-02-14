import { ApolloClient, InMemoryCache } from '@apollo/client';

const client = new ApolloClient({
  uri: import.meta.env.VITE_PUBLIC_TORII + '/graphql',
  cache: new InMemoryCache(),
});

export default client;
