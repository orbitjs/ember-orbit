import { toIdentifier } from 'orbit/lib/identifiers';

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

    const { type, id } = identity;
    const identifier = toIdentifier(type, id);

    return this._materialized[identifier] || this._materialize(type, id);
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

    const { type, id } = identity;
    const identifier = toIdentifier(type, id);

    return this._materialized[identifier];
  },

  evict(identity) {
    const record = this.materialized(identity);

    if (record) {
      const identifier = toIdentifier(identity);
      delete this._materialized[identifier];
      record.disconnect();
    }
  },

  _materialize(type, id) {
    // console.debug('materializing', type, id);
    const model = this._schema.modelFor(type);
    const record = model._create(id, this._store);
    const identifier = toIdentifier(type, id);

    this._materialized[identifier] = record;

    return record;
  }
});
