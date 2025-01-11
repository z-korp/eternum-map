import * as torii from '@dojoengine/torii-client';
import { defineContractComponents } from './contractComponents.ts';
import { world } from './world.ts';
import { DojoConfig, DojoProvider } from '@dojoengine/core';

export type SetupNetworkResult = Awaited<ReturnType<typeof setupNetwork>>;

export async function setupNetwork({ ...config }: DojoConfig) {
  const toriiClient = await torii.createClient({
    rpcUrl: config.rpcUrl,
    toriiUrl: config.toriiUrl,
    relayUrl: '',
    worldAddress: config.manifest.world.address || '',
  });

  const dojoProvider = new DojoProvider(config.manifest, config.rpcUrl);

  return {
    contractComponents: defineContractComponents(world),
    config,
    world,
    rpcProvider: dojoProvider.provider,
    toriiClient,
  };
}
