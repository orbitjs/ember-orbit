import EmberObject from '@ember/object';
import { getOwner } from '@ember/application';

function serializeRecordIdentity(record) {
  return `${record.type}:${record.id}`;
}

export default EmberObject.extend({
  _materialized: null,
  _modelFactoryMap: null,
  _store: null,

  init(...args) {
    this._super(...args);

    this._materialized = {};
    this._modelFactoryMap = {};
  },

  lookup(identity) {
    if (!identity) {
      return;
    }

    const identifier = serializeRecordIdentity(identity);

    return this._materialized[identifier] || this._materialize(identity);
  },

  lookupMany(identities) {
    return identities.map(identity => this.lookup(identity));
  },

  includes(identity) {
    return !!this.materialized(identity);
  },

  materialized(identity) {
    if (!identity) {
      return;
    }

    const identifier = serializeRecordIdentity(identity);

    return this._materialized[identifier];
  },

  evict(identity) {
    const record = this.materialized(identity);

    if (record) {
      const identifier = serializeRecordIdentity(identity);
      delete this._materialized[identifier];
      record.disconnect();
    }
  },

  _materialize(identity) {
    // console.debug('materializing', identity.type, identity.id);
    const modelFactory = this._modelFactoryFor(identity.type);
    const record = modelFactory.create({
      type: identity.type,
      id: identity.id,
      _store: this._store
    });
    const identifier = serializeRecordIdentity(identity);

    this._materialized[identifier] = record;

    return record;
  },

  _modelFactoryFor(type) {
    let modelFactory = this._modelFactoryMap[type];

    if (!modelFactory) {
      let owner = getOwner(this._store);
      let orbitConfig = owner.lookup('ember-orbit:config');
      modelFactory = owner.factoryFor(`${orbitConfig.types.model}:${type}`);
      this._modelFactoryMap[type] = modelFactory;
    }

    return modelFactory;
  }
});
