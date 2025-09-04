import type ApplicationInstance from '@ember/application/instance';
import { orbitRegistry } from '#src/-private/system/ember-orbit-setup.ts';
import { Model, setupOrbit, Store, type ModelSettings } from '#src/index.ts';
import type { Dict } from '@orbit/utils';

// const dataModels = import.meta.glob('../test-app/data-models/*.{js,ts}', {
//   eager: true,
// });
const dataSources = import.meta.glob('../test-app/data-sources/*.{js,ts}', {
  eager: true,
});
const dataStrategies = import.meta.glob(
  '../test-app/data-strategies/*.{js,ts}',
  {
    eager: true,
  },
);

export function createStore(
  owner: ApplicationInstance,
  dataModels: Dict<new (settings: ModelSettings) => Model>,
) {
  const orbitConfig = orbitRegistry.config;

  // if (models) {
  //   Object.keys(models).forEach((type: string) => {
  //     // @ts-expect-error TODO: fix this type error
  //     owner.register(`${orbitConfig.types.model}:${type}`, models[type]);
  //   });
  // }

  setupOrbit(owner, {
    ...dataModels,
    ...dataSources,
    ...dataStrategies,
  });

  debugger;

  return owner.lookup('service:store') as Store;
}
