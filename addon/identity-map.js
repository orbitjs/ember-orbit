import { serializeRecordIdentity } from '@orbit/data';

export default Ember.Object.extend({
  _schema: null,
  _orbitCache: null,
  _materialized: null,
  _store: null,

  init(...args) {
    this._super(...args);

    Ember.assert(this._schema, '_schema is required');
    Ember.assert(this._orbitCache, '_orbitCache is required');

    this._materialized = {};
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
    const model = this._schema.modelFor(identity.type);
    const record = model._create(identity.id, this._store);
    const identifier = serializeRecordIdentity(identity);

    this._materialized[identifier] = record;

    return record;
  }
});
