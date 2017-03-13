import { 
  addRecord,
  removeRecord,
  Query,
  QueryBuilder as qb
} from '@orbit/data';
import { Store as OrbitStore } from '@orbit/store';
import objectValues from './utils/object-values';
import Cache from './cache';
import IdentityMap from './identity-map';
import Source from './source';

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

    orbitCache.on('patch', operation => this._didPatch(operation));
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

  find(type, id, options) {
    if (id === undefined) {
      return this.query(qb.records(type), options);
    } else {
      return this.query(qb.record({type, id}), options);
    }
  },

  liveQuery(queryOrExpression, options) {
    const query = Query.from(queryOrExpression, options);
    this.orbitSource.query(query);
    return this.cache.liveQuery(query);
  },

  query(queryOrExpression, options) {
    const query = Query.from(queryOrExpression, options);
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

  addRecord(properties = {}, options) {
    this._verifyType(properties.type);

    const record = this.schema.normalize(properties);

    return this.update(addRecord(record), options)
      .then(() => this._identityMap.lookup(record));
  },

  findRecord(identity, options) {
    return this.query(qb.record(identity), options);
  },

  removeRecord(identity, options) {
    return this.update(removeRecord(identity), options);
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
