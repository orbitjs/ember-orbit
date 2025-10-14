import { getOwner, setOwner } from '@ember/owner';
import type Owner from '@ember/owner';
import type Cache from './cache.ts';
import type Model from './model.ts';
import type { ModelSettings } from './model.ts';
import { getOrbitRegistry } from './utils/orbit-registry.ts';
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
    const owner = getOwner(cache) as Owner;
    setOwner(this, owner);
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
      const owner = getOwner(this) as Owner;
      modelFactory = getOrbitRegistry(owner).registrations.models[
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
