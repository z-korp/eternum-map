import { Has, runQuery } from '@dojoengine/recs';
import { useDojo } from '../dojo/useDojo';

export const useTest = () => {
  const dojo = useDojo();

  const {
    setup: {
      components: { AddressName },
    },
  } = dojo;
  const playerEntities = runQuery([Has(AddressName)]);

  console.log('playerEntities', playerEntities);
};
