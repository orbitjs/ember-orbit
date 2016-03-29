import Schema from 'ember-orbit/schema';
import Cache from 'ember-orbit/cache';
import IdentityMap from 'ember-orbit/identity-map';
import OrbitStore from 'orbit-common/store';

/**
 @module ember-orbit
 */

const {
  assert,
  get,
  RSVP
} = Ember;

export default Ember.Object.extend({
  orbitStore: null,
  schema: null,
  cache: null,
  _identityMap: null,

  init() {
    this._super(...arguments);

    assert("`schema` must be injected onto a Store", this.schema);

    if (!this.orbitStore) {
      this.orbitStore = new OrbitStore({ schema: this.schema.orbitSchema });
    }

    const orbitCache = this.orbitStore.cache;

    this._identityMap = IdentityMap.create({ _schema: this.schema, _orbitCache: orbitCache, _store: this });
    this.cache = Cache.create({ _orbitCache: orbitCache, _identityMap: this._identityMap });

    orbitCache.patches.subscribe(operation => this._didPatch(operation));
  },

  query(...args) {
    return this.orbitStore.query(...args);
  },

  update(...args) {
    return this.orbitStore.update(...args);
  },

  addRecord(properties = {}) {
    this._verifyType(properties.type);

    const normalizedProperties = this.schema.normalize(properties);
    return this.update(t => t.addRecord(normalizedProperties))
      .then(() => {
        const { type, id } = normalizedProperties;
        return this._identityMap.lookup({ type, id });
      });
  },

  findRecord(type, id) {
    return this.query(q => q.record({type, id}))
      .then(record => this._identityMap.lookup(record));
  },

  removeRecord(record) {
    return this.update(t => t.removeRecord(record.getIdentifier()));
  },

  _verifyType(type) {
    assert("`type` must be registered as a model in the store's schema", this.schema.modelFor(type));
  },

  _didPatch: function(operation) {
    // console.debug('didPatch', operation);
    const { path } = operation;
    const { type, id } = operation.record;
    const record = this._identityMap.lookup({ type, id });

    switch(operation.op) {
      case 'replaceAttribute': return record.propertyDidChange(operation.attribute);
      case 'replaceHasOne': return record.propertyDidChange(operation.relationship);
      case 'removeRecord': return record.disconnect();
    }
  }
});
