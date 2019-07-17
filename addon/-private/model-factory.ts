import { getOwner } from '@ember/application';
import { Dict } from '@orbit/utils';
import { RecordIdentity, cloneRecordIdentity } from '@orbit/data';
import Store from './store';
import Model from './model';

export default class ModelFactory {
  private _store: Store;
  private _modelFactoryMap: Dict<any>;

  constructor(store: Store) {
    this._store = store;
    this._modelFactoryMap = {};
  }

  create(identity: RecordIdentity): Model {
    const modelFactory = this.modelFactoryFor(identity.type);
    return modelFactory.create({
      identity: cloneRecordIdentity(identity),
      _store: this._store
    });
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
