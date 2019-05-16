import { getOwner } from '@ember/application';

import { Dict } from '@orbit/utils';
import { RecordIdentity } from '@orbit/data';

import Store from './store';

export interface RecordModel {
  id: string;
  disconnect(): void;
}

export default class ModelFactory {
  private _store: Store;
  private _modelFactoryMap: Dict<any>;

  constructor(store: Store) {
    this._store = store;
    this._modelFactoryMap = {};
  }

  create(identity: RecordIdentity) {
    const modelFactory = this.modelFactoryFor(identity.type);
    return modelFactory.create({
      type: identity.type,
      id: identity.id,
      _store: this._store
    });
  }

  disconnect(record: RecordModel) {
    record.disconnect();
  }

  private modelFactoryFor(type: string) {
    let modelFactory = this._modelFactoryMap[type];

    if (!modelFactory) {
      let owner = getOwner(this._store);
      let orbitConfig = owner.lookup('ember-orbit:config');
      modelFactory = owner.factoryFor(`${orbitConfig.types.model}:${type}`);
      this._modelFactoryMap[type] = modelFactory;
    }

    return modelFactory;
  }
}
