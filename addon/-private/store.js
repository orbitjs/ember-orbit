import { isArray } from '@ember/array';
import { assert } from '@ember/debug';
import { getOwner } from '@ember/application';
import EmberObject, { get } from '@ember/object';
import {
  buildQuery
} from '@orbit/data';
import { deepSet } from '@orbit/utils';
import Cache from './cache';
import IdentityMap from './identity-map';

const Store = EmberObject.extend({
  source: null,
  cache: null,
  _identityMap: null,
  transformLog: null,
  requestQueue: null,
  syncQueue: null,

  init() {
    this._super(...arguments);

    assert("`source` must be injected onto a Store", this.source);

    this.transformLog = this.source.transformLog;
    this.requestQueue = this.source.requestQueue;
    this.syncQueue = this.source.syncQueue;

    const sourceCache = this.source.cache;

    assert("A Store's `source` must have its own `cache`", sourceCache);

    this._identityMap = IdentityMap.create({ _schema: this.source.schema, _sourceCache: sourceCache, _store: this });
    this.cache = Cache.create({ _sourceCache: sourceCache, _identityMap: this._identityMap });

    sourceCache.on('patch', this._didPatch, this);
  },

  willDestroy() {
    this._super(...arguments);
    if (this.source) {
      if (this.source.cache) {
        this.source.cache.off('patch', this._didPatch, this);
      }
      this.source = null;
    }
    if (this.cache) {
      this.cache.destroy();
      this.cache = null;
    }
    if (this._identityMap) {
      this._identityMap.destroy();
      this._identityMap = null;
    }
    this.transformLog = null;
    this.requestQueue = null;
    this.syncQueue = null;
  },

  fork() {
    const forkedSource = this.source.fork();

    return Store.create(
      getOwner(this).ownerInjection(),
      { source: forkedSource }
    );
  },

  merge(forkedStore, options = {}) {
    return this.source.merge(forkedStore.source, options);
  },

  rollback() {
    return this.source.rollback(...arguments);
  },

  liveQuery(queryOrExpression, options, id) {
    const query = buildQuery(queryOrExpression, options, id, this.source.queryBuilder);
    return this.source.query(query)
      .then(() => this.cache.liveQuery(query));
  },

  query(queryOrExpression, options, id) {
    const query = buildQuery(queryOrExpression, options, id, this.source.queryBuilder);
    return this.source.query(query)
      .then(result => {
        switch(query.expression.op) {
          case 'findRecord':
          case 'findRelatedRecord':
            return this._identityMap.lookup(result);
          case 'findRecords':
          case 'findRelatedRecords':
            return this._identityMap.lookupMany(result);
          default:
            return result;
        }
      });
  },

  addRecord(properties = {}, options) {
    let record = this.normalizeRecordProperties(properties);
    return this.update(t => t.addRecord(record), options)
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
    return this.query(q => q.findRecords(type), options);
  },

  findRecord(type, id, options) {
    return this.query(q => q.findRecord({ type, id }), options);
  },

  findRecordByKey(type, keyName, keyValue, options) {
    let keyMap = this.source.keyMap;
    let id = keyMap.keyToId(type, keyName, keyValue);
    if (!id) {
      id = this.source.schema.generateId(type);
      keyMap.pushRecord({ type, id, keys: { [keyName]: keyValue } });
    }
    return this.findRecord(type, id, options);
  },

  removeRecord(identity, options) {
    const { type, id } = identity;
    return this.update(t => t.removeRecord({ type, id }), options);
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
                record.notifyPropertyChange(field);
              }
            });
          }
        });
        break;
      case 'replaceAttribute':
        record = this._identityMap.lookup({ type, id });
        record.notifyPropertyChange(operation.attribute);
        break;
      case 'replaceRelatedRecord':
        record = this._identityMap.lookup({ type, id });
        record.notifyPropertyChange(operation.relationship);
        break;
      case 'removeRecord':
        this._identityMap.evict({ type, id });
        break;
    }
  },

  normalizeRecordProperties(properties) {
    const { id, type } = properties;

    assert("`type` must be registered as a model in the store's schema", this.source.schema.models[type]);

    const record = { id, type };

    this._assignKeys(record, properties);
    this._assignAttributes(record, properties);
    this._assignRelationships(record, properties);

    return record;
  },

  _assignKeys(record, properties) {
    const schema = this.source.schema;
    Object.keys(schema.models[record.type].keys).forEach(key => {
      if (properties[key] !== undefined) {
        deepSet(record, ['keys', key], properties[key]);
      }
    });
  },

  _assignAttributes(record, properties) {
    const schema = this.source.schema;
    Object.keys(schema.models[record.type].attributes).forEach(attribute => {
      if (properties[attribute] !== undefined) {
        deepSet(record, ['attributes', attribute], properties[attribute]);
      }
    });
  },

  _assignRelationships(record, properties) {
    const schema = this.source.schema;
    Object.keys(schema.models[record.type].relationships).forEach(relationshipName => {
      if (properties[relationshipName] !== undefined) {
        record.relationships = record.relationships || {};
        const relationshipProperties = schema.models[properties.type].relationships[relationshipName];
        this._normalizeRelationship(record, properties, relationshipName, relationshipProperties);
      }
    });
  },

  _normalizeRelationship(record, properties, relationshipName, relationshipProperties) {
    const value = properties[relationshipName];
    const relationship = record.relationships[relationshipName] = {};
    const type = relationshipProperties.model;

    if (isArray(value)) {
      relationship.data = value.map(id => {
        if (typeof id === 'object') {
          id = get(id, 'id');
        }
        return { type, id };
      });
    } else if (value === null) {
      relationship.data = null;
    } else if (typeof value === 'object') {
      let id = get(value, 'id');
      relationship.data = { type, id };

    } else {
      let id = value;
      relationship.data = { type, id };
    }
  }
});

export default Store;
