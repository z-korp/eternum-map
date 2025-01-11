import { StrictMode, useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { DojoProvider } from './dojo/context.tsx';
import { dojoConfig } from '../dojo.config.ts';
import App from './App.tsx';
import { Loading } from './screens/Loading.tsx';
import { setup, SetupResult } from './dojo/setup.ts';
import { ApolloProvider } from '@apollo/client';
import client from './apolloClient';
import './index.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

export function Main() {
  const [setupResult, setSetupResult] = useState<SetupResult | null>(null);

  const loading = useMemo(() => !setupResult, [setupResult]);

  useEffect(() => {
    async function initialize() {
      const setupResult = await setup(dojoConfig);
      setSetupResult(setupResult);
    }
    initialize();
  }, []);

  return (
    <ApolloProvider client={client}>
      <BrowserRouter>
        {!loading && setupResult ? (
          <DojoProvider value={setupResult}>
            <App />
          </DojoProvider>
        ) : (
          <Loading />
        )}
      </BrowserRouter>
    </ApolloProvider>
  );
}

root.render(<Main />);
