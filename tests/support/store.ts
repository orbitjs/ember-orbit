import type ApplicationInstance from '@ember/application/instance';
import StoreFactory from '#src/-private/factories/store-factory.ts';
import {
  CoordinatorFactory,
  MemorySourceFactory,
  Model,
  SchemaFactory,
  setupOrbit,
  Store,
  type ModelSettings,
} from '#src/index.ts';
import ValidatorFactory from '#src/services/data-validator.ts';
import type { Dict } from '@orbit/utils';

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
  models: Dict<new (settings: ModelSettings) => Model>,
) {
  // TODO: maybe make these not need such specific paths
  const dataModels = Object.fromEntries(
    Object.entries(models).map(([key, value]) => [
      `../test-app/data-models/${key}`,
      value,
    ]),
  );

  setupOrbit(owner, {
    ...dataModels,
    ...dataSources,
    ...dataStrategies,
  });

  // TODO: we should not need to manually register all these. Where did the magic go?
  owner.register(`data-source:store`, MemorySourceFactory);
  owner.register('service:data-coordinator', CoordinatorFactory);
  owner.register('service:data-schema', SchemaFactory);
  owner.register('service:data-validator', ValidatorFactory);
  owner.register('service:store', StoreFactory);
  return owner.lookup('service:store') as Store;
}
