import type Owner from '@ember/owner';
import { Model, setupOrbit, Store, type ModelSettings } from '#src/index.ts';
import { MemorySource } from '@orbit/memory';
import type { Dict } from '@orbit/utils';

let dataSources = import.meta.glob('../test-app/data-sources/*.{js,ts}', {
  eager: true,
});
const dataStrategies = import.meta.glob(
  '../test-app/data-strategies/*.{js,ts}',
  {
    eager: true,
  },
);

export function createStore(
  owner: Owner,
  models: Dict<new (settings: ModelSettings) => Model>,
  sources?: Dict<MemorySource>,
) {
  const dataModels = Object.fromEntries(
    Object.entries(models).map(([key, value]) => [
      `../test-app/data-models/${key}`,
      value,
    ]),
  );

  if (sources) {
    dataSources = Object.fromEntries(
      Object.entries(sources).map(([key, value]) => [
        `../test-app/data-sources/${key}`,
        value,
      ]),
    );
  }

  setupOrbit({
    ...dataModels,
    ...dataSources,
    ...dataStrategies,
  });

  return owner.lookup('service:store') as Store;
}
