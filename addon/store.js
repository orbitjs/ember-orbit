import Cache from 'ember-orbit/cache';
import IdentityMap from 'ember-orbit/identity-map';
import KeyMap from 'orbit/key-map';
import OrbitStore from 'orbit-store/store';
import Query from 'orbit/query';
import objectValues from 'ember-orbit/utils/object-values';
import qb from 'orbit/query/builder';
import {
  addRecord,
  removeRecord
} from 'orbit/transform/operators';

/**
 @module ember-orbit
 */

const { assert, getOwner } = Ember;

const Store = Ember.Object.extend({
  orbitStore: null,
  keyMap: null,
  schema: null,
  cache: null,
  _identityMap: null,

  init() {
    this._super(...arguments);

    assert("`schema` must be injected onto a Store", this.schema);

    if (!this.keyMap) {
      this.keyMap = this.orbitStore ? this.orbitStore.keyMap : new KeyMap();
    }

    if (!this.orbitStore) {
      this.orbitStore = new OrbitStore({ schema: this.schema.orbitSchema, keyMap: this.keyMap });
    }

    this.requestQueue = this.orbitStore.requestQueue;
    this.syncQueue = this.orbitStore.syncQueue;

    const orbitCache = this.orbitStore.cache;

    assert("A Store's `orbitStore` must have its own `cache`", orbitCache);

    this._identityMap = IdentityMap.create({ _schema: this.schema, _orbitCache: orbitCache, _store: this });
    this.cache = Cache.create({ _orbitCache: orbitCache, _identityMap: this._identityMap });

    orbitCache.patches.subscribe(operation => this._didPatch(operation));
  },

  fork() {
    const forkedOrbitStore = this.orbitStore.fork();

    return Store.create(
      getOwner(this).ownerInjection(),
      {
        orbitStore: forkedOrbitStore,
        keyMap: this.keyMap,
        schema: this.schema
      }
    );
  },

  merge(forkedStore, options = {}) {
    return this.orbitStore.merge(forkedStore.orbitStore, options);
  },

  find(type, id) {
    if (id === undefined) {
      return this.query(qb.records(type));
    } else {
      return this.query(qb.record({type, id}));
    }
  },

  liveQuery(queryOrExpression) {
    const query = Query.from(queryOrExpression, this.orbitStore.queryBuilder);
    this.orbitStore.query(query);
    return this.cache.liveQuery(query);
  },

  query(queryOrExpression) {
    const query = Query.from(queryOrExpression, this.orbitStore.queryBuilder);
    return this.orbitStore.query(query)
      .then(result => {
        switch(query.expression.op) {
          case 'record':  return this._identityMap.lookup(result);
          case 'records': return this._identityMap.lookupMany(objectValues(result));
          case 'filter':  return this._identityMap.lookupMany(objectValues(result));
          default:        return result;
        }
      });
  },

  update(...args) {
    return this.orbitStore.update(...args);
  },

  addRecord(properties = {}) {
    this._verifyType(properties.type);

    const record = this.schema.normalize(properties);
    return this.update(addRecord(record))
      .then(() => this._identityMap.lookup(record));
  },

  findRecord(type, id) {
    return this.query(qb.record({type, id}));
  },

  removeRecord(record) {
    return this.update(removeRecord(record));
  },

  _verifyType(type) {
    assert("`type` must be registered as a model in the store's schema", this.schema.modelFor(type));
  },

  _didPatch: function(operation) {
    // console.debug('didPatch', operation);
    const { type, id } = operation.record;
    const record = this._identityMap.lookup({ type, id });

    switch(operation.op) {
      case 'replaceAttribute': return record.propertyDidChange(operation.attribute);
      case 'replaceHasOne': return record.propertyDidChange(operation.relationship);
      case 'removeRecord': return record.disconnect();
    }
  }
});

export default Store;
