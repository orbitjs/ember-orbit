import type ApplicationInstance from '@ember/application/instance';
import type { Dict } from '@orbit/utils';
import { Model, Store, type ModelSettings } from 'ember-orbit';
import {
  initialize as initializeConfig,
  type OrbitConfig,
} from 'ember-orbit/initializers/ember-orbit-config';
import { initialize as initializeServices } from 'ember-orbit/initializers/ember-orbit-services';

export function createStore(
  owner: ApplicationInstance,
  models: Dict<new (settings: ModelSettings) => Model>,
) {
  initializeConfig(owner);
  initializeServices(owner);
  const orbitConfig = owner.lookup('ember-orbit:config') as OrbitConfig;

  if (models) {
    const types: string[] = [];
    Object.keys(models).forEach((type: string) => {
      // @ts-expect-error TODO: fix this type error
      owner.register(`${orbitConfig.types.model}:${type}`, models[type]);
      types.push(type);
    });

    owner.register('ember-orbit:model-names', types, {
      instantiate: false,
    });
  }

  return owner.lookup(`service:${orbitConfig.services.store}`) as Store;
}
