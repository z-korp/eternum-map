import { DojoConfig } from '@dojoengine/core';
import { createClientComponents } from './createClientComponents';
import { createSystemCalls } from './createSystemCalls';
import { setupNetwork } from './setupNetwork';
import { init } from '@dojoengine/sdk/experimental';

export type SetupResult = Awaited<ReturnType<typeof setup>>;

export async function setup({ ...config }: DojoConfig) {
  console.log('qqqq', config);
  const sdk = await init({
    client: {
      rpcUrl: config.rpcUrl,
      toriiUrl: config.toriiUrl,
      relayUrl: config.relayUrl,
      worldAddress: config.manifest.world.address,
    },
    domain: {
      name: 'eternum',
      version: '1.0',
      chainId: 'KATANA',
      revision: '1',
    },
  });
  console.log('sdk', sdk);

  const network = await setupNetwork(config);
  const components = createClientComponents(network);
  const systemCalls = createSystemCalls(network);

  console.log('bbbbb2');

  /*const configClauses: Clause[] = [
    {
      Keys: {
        keys: [WORLD_CONFIG_ID.toString(), undefined, undefined],
        pattern_matching: 'FixedLen',
        models: [],
      },
    },
    {
      Keys: {
        keys: [WORLD_CONFIG_ID.toString(), undefined],
        pattern_matching: 'FixedLen',
        models: [],
      },
    },
    {
      Keys: {
        keys: [BUILDING_CATEGORY_POPULATION_CONFIG_ID.toString(), undefined],
        pattern_matching: 'FixedLen',
        models: [],
      },
    },
    {
      Keys: {
        keys: [HYPERSTRUCTURE_CONFIG_ID.toString(), undefined],
        pattern_matching: 'VariableLen',
        models: [],
      },
    },
  ];

  await getEntities(
    network.toriiClient,
    { Composite: { operator: 'Or', clauses: configClauses } },
    network.contractComponents as any
  );*/

  //console.log('bbbbb');

  // fetch all existing entities from torii
  /*await getEntities(
    network.toriiClient,
    {
      Keys: {
        keys: [undefined],
        pattern_matching: 'FixedLen',
        models: ['s0-eternum-Army'],
      },
    },
    network.contractComponents as any,
    [],
    [],
    10_000,
    false
  );*/

  /*const sync = await syncEntities(
    network.toriiClient,
    network.contractComponents as any,
    [],
    false
  );

  console.log('cccc');

  const eventSync = getSyncEvents(
    network.toriiClient,
    network.contractComponents.events as any,
    {
      Keys: {
        keys: [undefined],
        pattern_matching: 'VariableLen',
        models: ['s0_eternum-GameEnded'],
      },
    },
    [
      {
        Keys: {
          keys: [undefined],
          pattern_matching: 'VariableLen',
          models: ['s0_eternum-GameEnded'],
        },
      },
    ],
    [],
    [],
    10_000,
    false,
    false
  );*/

  return {
    network,
    components,
    systemCalls,
    sync: undefined,
    eventSync: undefined,
    sdk,
  };
}
