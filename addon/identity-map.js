const { get } = Ember;

export default Ember.Object.extend({
  _schema: null,
  _orbitCache: null,
  _materialized: null,
  _store: null,

  init(...args) {
    this._super.apply(this, ...args);

    Ember.assert(this.get('_schema'), '_schema is required');
    Ember.assert(this.get('_orbitCache'), '_orbitCache is required');

    this.set('_materialized', {});
  },

  lookup(identifier) {
    if (!identifier) return;

    const { type, id } = identifier;

    const materialized = this.get('_materialized');
    const identifierKey = this._identifierKey(type, id);

    return materialized[identifierKey] || this._materialize(type, id);
  },

  lookupMany(identifiers) {
    return identifiers.map(identifier => this.lookup(identifier));
  },

  contains(identifier) {
    if (!identifier) return;

    const { type, id } = identifier;

    const materialized = this.get('_materialized');
    const identifierKey = this._identifierKey(type, id);

    return !!materialized[identifierKey];
  },

  identifier(record) {
    return {
      type: get(record.constructor, 'typeKey'),
      id: record.get('id')
    };
  },

  evict(record) {
    console.debug('evicting', record);
    const materialized = this.get('_materialized');
    const identifierKey = this._identifierKey(record.type, record.id);
    delete materialized[identifierKey];
    console.debug('materialized after evict', identifierKey, materialized);
    record.disconnect();
  },

  _materialize(type, id) {
    console.debug('materializing', type, id);
    const schema = this.get('_schema');
    const store = this.get('_store');
    const materialized = this.get('_materialized');
    const model = schema.modelFor(type);
    const record = model._create(id, store);
    const identifier = this._identifierKey(type, id);

    materialized[identifier] = record;

    return record;
  },

  _identifierKey(type, id) {
    return `${type}:${id}`;
  }
});
