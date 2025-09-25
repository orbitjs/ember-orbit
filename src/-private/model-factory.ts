import Cache from './cache.ts';
import Model, { type ModelSettings } from './model.ts';
import { orbitRegistry } from './system/ember-orbit-setup.ts';
import Orbit from '@orbit/core';
import { cloneRecordIdentity, type RecordIdentity } from '@orbit/records';
import type { Dict } from '@orbit/utils';

const { assert } = Orbit;

interface Factory {
  create(settings: ModelSettings): Model;
}

export default class ModelFactory {
  #cache: Cache;
  #modelFactoryMap: Dict<Factory>;

  constructor(cache: Cache) {
    this.#cache = cache;
    this.#modelFactoryMap = {};
  }

  create(identity: RecordIdentity): Model {
    const modelFactory = this.modelFactoryFor(identity.type);

    return modelFactory.create({
      identity: cloneRecordIdentity(identity),
      cache: this.#cache,
    });
  }

  private modelFactoryFor(type: string): Factory {
    let modelFactory = this.#modelFactoryMap[type];

    if (!modelFactory) {
      modelFactory = orbitRegistry.registrations.models[
        type as keyof object
      ] as unknown as Factory;
      assert(
        `An ember-orbit model for type ${type} has not been registered.`,
        modelFactory !== undefined,
      );

      this.#modelFactoryMap[type] = modelFactory;
    }

    return modelFactory;
  }
}
