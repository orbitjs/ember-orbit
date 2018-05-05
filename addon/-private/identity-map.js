import EmberObject from '@ember/object';
import { getOwner } from '@ember/application';

function serializeRecordIdentity(record) {
  return `${record.type}:${record.id}`;
}

export default EmberObject.extend({
  _materialized: null,
  _modelTypeMap: null,
  _store: null,

  init(...args) {
    this._super(...args);

    this._materialized = {};
    this._modelTypeMap = {};
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
    const model = this._modelFor(identity.type);
    const record = model._create(identity.id, this._store);
    const identifier = serializeRecordIdentity(identity);

    this._materialized[identifier] = record;

    return record;
  },

  _modelFor(type) {
    let model = this._modelTypeMap[type];

    if (!model) {
      model = getOwner(this._store).factoryFor(`model:${type}`).class;
      model.typeKey = type;
      this._modelTypeMap[type] = model;
    }

    return model;
  }
});
