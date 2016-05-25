import Schema from 'ember-orbit/schema';
import Cache from 'ember-orbit/cache';
import IdentityMap from 'ember-orbit/identity-map';
import OrbitStore from 'orbit-common/store';
import Query from 'orbit/query';

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

  find(type, id) {
    if (id === undefined) {
      return this.query(q => q.recordsOfType(type));
    } else {
      return this.query(q => q.record({type, id}));
    }
  },

  query(queryOrExpression) {
    const query = Query.from(queryOrExpression, this.orbitStore.queryBuilder);
    return this.orbitStore.query(query)
      .then(result => {
        switch(query.expression.op) {
          case 'record':        return this._identityMap.lookup(result);
          case 'recordsOfType': return this._identityMap.lookupMany(Object.values(result));
          case 'filter':        return this._identityMap.lookupMany(Object.values(result));
          default:              return result;
        }
      });
  },

  update(...args) {
    return this.orbitStore.update(...args);
  },

  addRecord(properties = {}) {
    this._verifyType(properties.type);

    const record = this.schema.normalize(properties);
    return this.update(t => t.addRecord(record))
      .then(() => this._identityMap.lookup(record));
  },

  findRecord(type, id) {
    return this.query(q => q.record({type, id}));
  },

  removeRecord(record) {
    return this.update(t => t.removeRecord(record));
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
