import type { Dict } from '@orbit/utils';
import { Model, type ModelSettings } from 'ember-orbit';
import { initialize as initializeConfig } from 'ember-orbit/initializers/ember-orbit-config';
import { initialize as initializeServices } from 'ember-orbit/initializers/ember-orbit-services';

export function createStore(
  owner: any,
  models: Dict<new (settings: ModelSettings) => Model>
) {
  initializeConfig(owner);
  initializeServices(owner);
  const orbitConfig = owner.lookup('ember-orbit:config');

  if (models) {
    const types: string[] = [];
    Object.keys(models).forEach((type: string) => {
      owner.register(`${orbitConfig.types.model}:${type}`, models[type]);
      types.push(type);
    });

    owner.register('ember-orbit:model-names', types, {
      instantiate: false
    });
  }

  return owner.lookup(`service:${orbitConfig.services.store}`);
}
