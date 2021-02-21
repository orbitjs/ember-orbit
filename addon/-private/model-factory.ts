import Orbit from '@orbit/core';
import { getOwner } from '@ember/application';
import { Dict } from '@orbit/utils';
import { RecordIdentity, cloneRecordIdentity } from '@orbit/records';
import Store from './store';
import Model, { ModelSettings } from './model';

const { assert } = Orbit;

interface Factory {
  create(settings: ModelSettings): Model;
}

export default class ModelFactory {
  #store: Store;
  #modelFactoryMap: Dict<Factory>;
  #mutableModelFields: boolean;

  constructor(store: Store, mutableModelFields: boolean) {
    this.#store = store;
    this.#modelFactoryMap = {};
    this.#mutableModelFields = mutableModelFields;
  }

  create(identity: RecordIdentity): Model {
    const modelFactory = this.modelFactoryFor(identity.type);
    return modelFactory.create({
      identity: cloneRecordIdentity(identity),
      store: this.#store,
      mutableFields: this.#mutableModelFields
    });
  }

  private modelFactoryFor(type: string): Factory {
    let modelFactory = this.#modelFactoryMap[type];

    if (!modelFactory) {
      let owner = getOwner(this.#store);
      let orbitConfig = owner.lookup('ember-orbit:config');

      modelFactory = owner.factoryFor(
        `${orbitConfig.types.model}:${type}`
      ) as Factory;

      assert(
        `An ember-orbit model for type ${type} has not been registered.`,
        modelFactory !== undefined
      );

      this.#modelFactoryMap[type] = modelFactory;
    }

    return modelFactory;
  }
}
