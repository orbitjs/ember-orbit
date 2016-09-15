import Cache from 'ember-orbit/cache';
import IdentityMap from 'ember-orbit/identity-map';
import Query from 'orbit/query';
import qb from 'orbit/query/builder';
import {
  addRecord,
  removeRecord
} from 'orbit/transform/operators';
import OrbitStore from 'orbit-store/store';
import objectValues from './utils/object-values';
import Source from './source';

/**
 @module ember-orbit
 */

const { assert, getOwner } = Ember;

const Store = Source.extend({
  OrbitSourceClass: OrbitStore,
  cache: null,
  _identityMap: null,

  init() {
    this._super(...arguments);

    const orbitCache = this.orbitSource.cache;

    assert("A Store's `orbitSource` must have its own `cache`", orbitCache);

    this._identityMap = IdentityMap.create({ _schema: this.schema, _orbitCache: orbitCache, _store: this });
    this.cache = Cache.create({ _orbitCache: orbitCache, _identityMap: this._identityMap });

    orbitCache.patches.subscribe(operation => this._didPatch(operation));
  },

  fork() {
    const forkedOrbitStore = this.orbitSource.fork();

    return Store.create(
      getOwner(this).ownerInjection(),
      {
        orbitSource: forkedOrbitStore,
        keyMap: this.keyMap,
        schema: this.schema
      }
    );
  },

  merge(forkedStore, options = {}) {
    return this.orbitSource.merge(forkedStore.orbitSource, options);
  },

  rollback() {
    return this.orbitSource.rollback(...arguments);
  },

  find(type, id) {
    if (id === undefined) {
      return this.query(qb.records(type));
    } else {
      return this.query(qb.record({type, id}));
    }
  },

  liveQuery(queryOrExpression) {
    const query = Query.from(queryOrExpression, this.orbitSource.queryBuilder);
    this.orbitSource.query(query);
    return this.cache.liveQuery(query);
  },

  query(queryOrExpression) {
    const query = Query.from(queryOrExpression, this.orbitSource.queryBuilder);
    return this.orbitSource.query(query)
      .then(result => {
        switch(query.expression.op) {
          case 'record':
          case 'relatedRecord':
            return this._identityMap.lookup(result);
          case 'records':
          case 'relatedRecords':
          case 'filter':
            return this._identityMap.lookupMany(objectValues(result));
          default:
            return result;
        }
      });
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
    const { type, id } = record;
    const identity = { type, id };
    return this.update(removeRecord(identity));
  },

  _verifyType(type) {
    assert("`type` must be registered as a model in the store's schema", this.schema.modelFor(type));
  },

  _didPatch: function(operation) {
    // console.debug('didPatch', operation);

    let record;
    const { type, id } = operation.record;

    switch(operation.op) {
      case 'replaceAttribute':
        record = this._identityMap.lookup({ type, id });
        record.propertyDidChange(operation.attribute);
        break;
      case 'replaceHasOne':
        record = this._identityMap.lookup({ type, id });
        record.propertyDidChange(operation.relationship);
        break;
      case 'removeRecord':
        this._identityMap.evict({ type, id });
        break;
    }
  }
});

export default Store;
