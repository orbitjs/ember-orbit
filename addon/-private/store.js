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
  SourceClass: OrbitStore,
  sourceOptions: null,
  source: null,
  cache: null,
  schema: null,
  keyMap: null,
  _identityMap: null,

  init() {
    this._super(...arguments);

    assert("`schema` must be injected onto a Source", this.schema);
    assert("`keyMap` must be injected onto a Source", this.keyMap);

    if (!this.source) {
      let SourceClass = this.SourceClass;
      if (SourceClass.wrappedFunction) {
        SourceClass = SourceClass.wrappedFunction;
      }

      let options = this.sourceOptions || {};
      options.schema = this.schema;
      options.keyMap = this.keyMap;
      if (this.bucket) {
        options.bucket = this.bucket;
      }

      this.source = new SourceClass(options);
    }

    this.transformLog = this.source.transformLog;
    this.requestQueue = this.source.requestQueue;
    this.syncQueue = this.source.syncQueue;

    if (this.coordinator) {
      this.coordinator.addSource(this.source);
    }

    const sourceCache = this.source.cache;

    assert("A Store's `source` must have its own `cache`", sourceCache);

    this._identityMap = IdentityMap.create({ _schema: this.schema, _sourceCache: sourceCache, _store: this });
    this.cache = Cache.create({ _sourceCache: sourceCache, _identityMap: this._identityMap });

    sourceCache.on('patch', operation => this._didPatch(operation));
  },

  willDestroy() {
    if (this.coordinator) {
      this.coordinator.removeSource(this.source);
    }
  },

  fork() {
    const forkedSource = this.source.fork();

    return Store.create(
      getOwner(this).ownerInjection(),
      {
        source: forkedSource,
        keyMap: this.keyMap,
        schema: this.schema
      }
    );
  },

  merge(forkedStore, options = {}) {
    return this.source.merge(forkedStore.source, options);
  },

  rollback() {
    return this.source.rollback(...arguments);
  },

  liveQuery(queryOrExpression, options) {
    const query = Query.from(queryOrExpression, options);
    return this.source.query(query)
      .then(() => this.cache.liveQuery(query));
  },

  query(queryOrExpression, options) {
    const query = Query.from(queryOrExpression, options);
    return this.source.query(query)
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

  find(type, id, options) {
    if (id === undefined) {
      return this.findAll(type, options);
    } else {
      return this.findRecord(type, id, options);
    }
  },

  findAll(type, options) {
    return this.query(oqb.records(type), options);
  },

  findRecord(type, id, options) {
    return this.query(oqb.record({ type, id }), options);
  },

  removeRecord(identity, options) {
    return this.update(removeRecord(identity), options);
  },

  on() {
    return this.source.on(...arguments);
  },

  off() {
    return this.source.off(...arguments);
  },

  one() {
    return this.source.one(...arguments);
  },

  sync() {
    return this.source.sync(...arguments);
  },

  update() {
    return this.source.update(...arguments);
  },

  getTransform() {
    return this.source.getTransform(...arguments);
  },

  getInverseOperations() {
    return this.source.getInverseOperations(...arguments);
  },

  _verifyType(type) {
    assert("`type` must be registered as a model in the store's schema", this.schema.models[type]);
  },

  _didPatch: function(operation) {
    // console.debug('didPatch', operation);

    const replacement = operation.record;
    const { type, id } = replacement;
    let record;

    switch(operation.op) {
      case 'replaceRecord':
        record = this._identityMap.lookup({ type, id });
        ['attributes', 'keys', 'relationships'].forEach(grouping => {
          if (replacement[grouping]) {
            Object.keys(replacement[grouping]).forEach(field => {
              if (replacement[grouping].hasOwnProperty(field)) {
                record.propertyDidChange(field);
              }
            });
          }
        });
        break;
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
