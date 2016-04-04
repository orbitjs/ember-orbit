const { get } = Ember;

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

  lookup(identifier) {
    if (!identifier) return;

    const { type, id } = identifier;
    const identifierKey = this._identifierKey(type, id);

    return this._materialized[identifierKey] || this._materialize(type, id);
  },

  lookupMany(identifiers) {
    return identifiers.map(identifier => this.lookup(identifier));
  },

  contains(identifier) {
    if (!identifier) return;

    const { type, id } = identifier;
    const identifierKey = this._identifierKey(type, id);

    return !!this._materialized[identifierKey];
  },

  evict(record) {
    // console.debug('evicting', record);
    const identifierKey = this._identifierKey(record.type, record.id);
    delete this._materialized[identifierKey];
    // console.debug('materialized after evict', identifierKey, this._materialized);
    record.disconnect();
  },

  _materialize(type, id) {
    // console.debug('materializing', type, id);
    const model = this._schema.modelFor(type);
    const record = model._create(id, this._store);
    const identifier = this._identifierKey(type, id);

    this._materialized[identifier] = record;

    return record;
  },

  _identifierKey(type, id) {
    return `${type}:${id}`;
  }
});
