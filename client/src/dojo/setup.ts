import {
  BUILDING_CATEGORY_POPULATION_CONFIG_ID,
  HYPERSTRUCTURE_CONFIG_ID,
  WORLD_CONFIG_ID,
} from '@bibliothecadao/eternum';
import { DojoConfig } from '@dojoengine/core';
import { getEntities, getSyncEvents, syncEntities } from '@dojoengine/state';
import { Clause } from '@dojoengine/torii-client';
import { createClientComponents } from './createClientComponents';
import { createSystemCalls } from './createSystemCalls';
import { ClientConfigManager } from './modelManager/ConfigManager';
import { setupNetwork } from './setupNetwork';

export type SetupResult = Awaited<ReturnType<typeof setup>>;

export const configManager = ClientConfigManager.instance();

export async function setup({ ...config }: DojoConfig) {
  const network = await setupNetwork(config);
  const components = createClientComponents(network);
  const systemCalls = createSystemCalls(network);

  const configClauses: Clause[] = [
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

  /*await getEntities(
    network.toriiClient,
    { Composite: { operator: 'Or', clauses: configClauses } },
    network.contractComponents as any
  );*/

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

  const sync = await syncEntities(
    network.toriiClient,
    network.contractComponents as any,
    [],
    false
  );

  configManager.setDojo(components);

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
  );

  return {
    network,
    components,
    systemCalls,
    sync,
    eventSync,
  };
}
