import { 
  addRecord,
  removeRecord,
  Query,
  oqb
} from '@orbit/data';
import { deepSet, objectValues } from '@orbit/utils';
import OrbitStore from '@orbit/store';
import Cache from './cache';
import IdentityMap from './identity-map';

const { assert, getOwner, get } = Ember;

const Store = Ember.Object.extend({
  OrbitSourceClass: OrbitStore,
  cache: null,
  schema: null,
  keyMap: null,
  _identityMap: null,

  init() {
    this._super(...arguments);

    assert("`schema` must be injected onto a Source", this.schema);
    assert("`keyMap` must be injected onto a Source", this.keyMap);

    if (!this.orbitSource) {
      let OrbitSourceClass = this.OrbitSourceClass;
      if (OrbitSourceClass.wrappedFunction) {
        OrbitSourceClass = OrbitSourceClass.wrappedFunction;
      }

      let options = this.orbitSourceOptions || {};
      options.schema = this.schema;
      options.keyMap = this.keyMap;
      if (this.bucket) {
        options.bucket = this.bucket;
      }

      this.orbitSource = new OrbitSourceClass(options);
    }

    this.transformLog = this.orbitSource.transformLog;
    this.requestQueue = this.orbitSource.requestQueue;
    this.syncQueue = this.orbitSource.syncQueue;

    if (this.coordinator) {
      this.coordinator.addSource(this.orbitSource);
    }
 
    const orbitCache = this.orbitSource.cache;

    assert("A Store's `orbitSource` must have its own `cache`", orbitCache);

    this._identityMap = IdentityMap.create({ _schema: this.schema, _orbitCache: orbitCache, _store: this });
    this.cache = Cache.create({ _orbitCache: orbitCache, _identityMap: this._identityMap });

    orbitCache.on('patch', operation => this._didPatch(operation));
  },

  willDestroy() {
    if (this.coordinator) {
      this.coordinator.removeSource(this.orbitSource);
    }
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
      return this.query(oqb.records(type), options);
    } else {
      return this.query(oqb.record({type, id}), options);
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

    const record = this.normalizeRecordProperties(properties);

    return this.update(addRecord(record), options)
      .then(() => this._identityMap.lookup(record));
  },

  findRecord(identity, options) {
    return this.query(oqb.record(identity), options);
  },

  removeRecord(identity, options) {
    return this.update(removeRecord(identity), options);
  },

  on() {
    return this.orbitSource.on(...arguments);
  },

  off() {
    return this.orbitSource.off(...arguments);
  },

  one() {
    return this.orbitSource.one(...arguments);
  },

  sync() {
    return this.orbitSource.sync(...arguments);
  },

  update() {
    return this.orbitSource.update(...arguments);
  },

  _verifyType(type) {
    assert("`type` must be registered as a model in the store's schema", this.schema.models[type]);
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
  },

  normalizeRecordProperties(properties) {
    const record = {
      id: properties.id || this.schema.generateId(properties.type),
      type: properties.type
    };

    this._assignKeys(record, properties);
    this._assignAttributes(record, properties);
    this._assignRelationships(record, properties);

    return record;
  },

  _assignKeys(record, properties) {
    Object.keys(this.schema.models[record.type].keys).forEach(key => {
      if (properties[key] !== undefined) {
        deepSet(record, ['keys', key], properties[key]);
      }
    });
  },

  _assignAttributes(record, properties) {
    Object.keys(this.schema.models[record.type].attributes).forEach(attribute => {
      if (properties[attribute] !== undefined) {
        deepSet(record, ['attributes', attribute], properties[attribute]);
      }
    });
  },

  _assignRelationships(record, properties) {
    Object.keys(this.schema.models[record.type].relationships).forEach(relationshipName => {
      if (properties[relationshipName] !== undefined) {
        record.relationships = record.relationships || {};
        const relationshipProperties = this.schema.models[properties.type].relationships[relationshipName];
        this._normalizeRelationship(record, properties, relationshipName, relationshipProperties);
      }
    });
  },

  _normalizeRelationship(record, properties, relationshipName, relationshipProperties) {
    const value = properties[relationshipName];
    const relationship = record.relationships[relationshipName] = {};
    const modelType = relationshipProperties.model;

    if (Ember.isArray(value)) {
      relationship.data = {};

      value.forEach(function(id) {
        if (typeof id === 'object') {
          id = get(id, 'id');
        }
        const identifier = [modelType, id].join(':');
        relationship.data[identifier] = true;
      });

    } else if (typeof value === 'object') {

      const identifier = [modelType, get(value, 'id')].join(':');
      relationship.data = identifier;

    } else {
      relationship.data = [modelType, value].join(':');
    }
  }
});

export default Store;
