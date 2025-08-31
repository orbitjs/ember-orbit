import type ApplicationInstance from '@ember/application/instance';
import type { Dict } from '@orbit/utils';
import { Model, Store, type ModelSettings } from '#src/index.ts';
import {
  initialize as orbitConfigInitialize,
  type OrbitConfig,
} from '#src/instance-initializers/ember-orbit-config.ts';
import { initialize as orbitServicesInitialize } from '#src/instance-initializers/ember-orbit-services.ts';

export function createStore(
  owner: ApplicationInstance,
  models: Dict<new (settings: ModelSettings) => Model>,
) {
  orbitConfigInitialize(owner);
  orbitServicesInitialize(owner);
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
