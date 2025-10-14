
import { getOwner, setOwner } from '@ember/owner';
import { g as getOrbitRegistry } from './orbit-registry-BOeq-4ry.js';
import { MemorySource } from '@orbit/memory';
import { registerDestructor, associateDestroyableChild, destroy } from '@ember/destroyable';
import { tracked } from '@glimmer/tracking';
import { notifyPropertyChange as notifyPropertyChange$1 } from '@ember/object';
import { createCache, getValue } from '@glimmer/tracking/primitives/cache';
import Orbit$1, { Orbit, Assertion } from '@orbit/core';
import { g, i } from 'decorator-transforms/runtime-esm';
import { cloneRecordIdentity, serializeRecordIdentity, deserializeRecordIdentity, RecordKeyMap, StandardRecordNormalizer, RecordSchema, buildRecordValidatorFor } from '@orbit/records';
import { buildTransform, buildQuery } from '@orbit/data';
import IdentityMap from '@orbit/identity-map';
import { clone, deepMerge, deepSet } from '@orbit/utils';
import { DEBUG } from '@glimmer/env';
import { Coordinator } from '@orbit/coordinator';
import '@ember/debug';
import 'ember-primitives/store';
import '@orbit/serializers';
import { getOwner as getOwner$1 } from '@ember/-internals/owner';

function applyStandardSourceInjections(injections) {
  const owner = getOwner(injections);
  const orbitRegistry = getOrbitRegistry(owner);
  injections.bucket = orbitRegistry.registrations.buckets['main'];
  injections.keyMap = orbitRegistry.services.dataKeyMap;
  injections.normalizer = orbitRegistry.services.dataNormalizer;
  injections.schema = orbitRegistry.services.dataSchema;
  injections.validatorFor = orbitRegistry.services.dataValidator;
}

var MemorySourceFactory = {
  create(injections) {
    applyStandardSourceInjections(injections);
    injections.name = injections.name ?? 'store';
    injections.cacheSettings = {
      debounceLiveQueries: false
    };
    return new MemorySource(injections);
  }
};

const {
  assert: assert$9,
  deprecate: deprecate$4
} = Orbit;
class LiveQuery {
  #query;
  #cache;
  #iteratorAccessed = false;
  #value = createCache(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    this._invalidate;
    return this.#cache.query(this.#query);
  });
  static {
    g(this.prototype, "_invalidate", [tracked], function () {
      return 0;
    });
  }
  #_invalidate = (i(this, "_invalidate"), void 0);
  constructor(settings) {
    this.#query = settings.query;
    this.#cache = settings.cache;
    const unsubscribe = settings.liveQuery.subscribe(() => {
      this._invalidate++;
      if (this.#iteratorAccessed) {
        notifyPropertyChange$1(this, '[]');
      }
    });
    registerDestructor(this, unsubscribe);
    associateDestroyableChild(this.#cache, this);
  }
  get query() {
    return this.#query;
  }

  /**
   * @deprecated
   */
  get content() {
    deprecate$4('LiveQuery#content is deprecated. Access LiveQuery#value instead.');
    return this.value;
  }
  get value() {
    return getValue(this.#value);
  }
  get length() {
    return this.value.length;
  }
  [Symbol.iterator]() {
    assert$9('LiveQuery result is not a collection. You can access the result as `liveQuery.value`.', Array.isArray(this.value));
    this.#iteratorAccessed = true;
    return this.value[Symbol.iterator]();
  }
  destroy() {
    destroy(this);
  }
}

const {
  assert: assert$8
} = Orbit$1;
class ModelFactory {
  #cache;
  #modelFactoryMap;
  constructor(cache) {
    const owner = getOwner(cache);
    setOwner(this, owner);
    this.#cache = cache;
    this.#modelFactoryMap = {};
  }
  create(identity) {
    const modelFactory = this.modelFactoryFor(identity.type);
    return modelFactory.create({
      identity: cloneRecordIdentity(identity),
      cache: this.#cache
    });
  }
  modelFactoryFor(type) {
    let modelFactory = this.#modelFactoryMap[type];
    if (!modelFactory) {
      const owner = getOwner(this);
      modelFactory = getOrbitRegistry(owner).registrations.models[type];
      assert$8(`An ember-orbit model for type ${type} has not been registered.`, modelFactory !== undefined);
      this.#modelFactoryMap[type] = modelFactory;
    }
    return modelFactory;
  }
}

class RecordIdentitySerializer {
  serialize(identity) {
    return serializeRecordIdentity(identity);
  }
  deserialize(identifier) {
    return deserializeRecordIdentity(identifier);
  }
}
const recordIdentitySerializer = new RecordIdentitySerializer();

const {
  assert: assert$7,
  deprecate: deprecate$3
} = Orbit;
class Cache {
  #sourceCache;
  #store;
  #base;
  #modelFactory;
  allowUpdates;
  _identityMap = new IdentityMap({
    serializer: recordIdentitySerializer
  });
  constructor(settings) {
    const owner = getOwner(settings);
    setOwner(this, owner);
    this.#sourceCache = settings.sourceCache;
    this.#store = settings.store;
    this.#base = settings.base;
    this.#modelFactory = new ModelFactory(this);
    this.allowUpdates = this.#sourceCache.base !== undefined;
    const patchUnbind = this.#sourceCache.on('patch', this.generatePatchListener());
    registerDestructor(this, () => {
      patchUnbind();
      this._identityMap.clear();
    });
  }
  get sourceCache() {
    return this.#sourceCache;
  }
  get store() {
    return this.#store;
  }
  get keyMap() {
    return this.#sourceCache.keyMap;
  }
  get schema() {
    return this.#sourceCache.schema;
  }
  get queryBuilder() {
    return this.#sourceCache.queryBuilder;
  }
  get transformBuilder() {
    return this.#sourceCache.transformBuilder;
  }
  get validatorFor() {
    return this.#sourceCache.validatorFor;
  }
  get defaultQueryOptions() {
    return this.#sourceCache.defaultQueryOptions;
  }
  set defaultQueryOptions(options) {
    this.#sourceCache.defaultQueryOptions = options;
  }
  get defaultTransformOptions() {
    return this.#sourceCache.defaultTransformOptions;
  }
  set defaultTransformOptions(options) {
    this.#sourceCache.defaultTransformOptions = options;
  }
  get isForked() {
    return this.#sourceCache.base !== undefined;
  }
  get base() {
    return this.#base;
  }
  fork(settings = {}) {
    const forkedCache = this.#sourceCache.fork(settings);
    const injections = getOwner(this).ownerInjection();
    return new Cache({
      ...injections,
      sourceCache: forkedCache,
      base: this
    });
  }
  merge(forkedCache, options) {
    if (options?.fullResponse) {
      let response = this.#sourceCache.merge(forkedCache.sourceCache, options);
      if (response.data !== undefined) {
        const data = this._lookupTransformResult(response.data, true // merge results should ALWAYS be an array
        );
        response = {
          ...response,
          data
        };
      }
      return response;
    } else {
      let response = this.#sourceCache.merge(forkedCache.sourceCache, options);
      if (response !== undefined) {
        response = this._lookupTransformResult(response, true // merge results should ALWAYS be an array
        );
      }
      return response;
    }
  }
  rebase() {
    this.#sourceCache.rebase();
  }
  reset() {
    this.#sourceCache.reset();
  }
  getRecordData(type, id) {
    return this.#sourceCache.getRecordSync({
      type,
      id
    });
  }
  includesRecord(type, id) {
    return this.getRecordData(type, id) !== undefined;
  }
  recordIdFromKey(type, keyName, keyValue) {
    const keyMap = this.keyMap;
    assert$7('No `keyMap` has been assigned to the Cache, so `recordIdFromKey` can not work.', keyMap !== undefined);
    let id = keyMap.keyToId(type, keyName, keyValue);
    if (!id) {
      id = this.schema.generateId(type);
      keyMap.pushRecord({
        type,
        id,
        keys: {
          [keyName]: keyValue
        }
      });
    }
    return id;
  }

  /**
   * @deprecated
   */
  peekRecordData(type, id) {
    deprecate$3('Cache#peekRecordData is deprecated. Call `getRecordData` instead.');
    return this.#sourceCache.getRecordSync({
      type,
      id
    });
  }

  /**
   * @deprecated
   */
  peekRecord(type, id) {
    deprecate$3('Cache#peekRecord is deprecated. Call `findRecord` instead.');
    return this.findRecord(type, id);
  }

  /**
   * @deprecated
   */
  peekRecords(type) {
    deprecate$3('Cache#peekRecords is deprecated. Call `findRecords` instead.');
    return this.findRecords(type);
  }

  /**
   * @deprecated
   */
  peekRecordByKey(type, key, value) {
    deprecate$3('Cache#peekRecordByKey is deprecated. Instead of `cache.peekRecordByKey(type, key, value)`, call `cache.findRecord({ type, key, value })` or `cache.query(...)`.');
    return this.findRecord({
      type,
      key,
      value
    });
  }

  /**
   * @deprecated
   */
  peekKey(identity, key) {
    deprecate$3("Cache#peekKey is deprecated. Instead of `cache.peekKey({ type, id }, value)`, call `cache.findRecord({ type, id })` and then access the record's fields directly.");
    const record = this.#sourceCache.getRecordSync(identity);
    return record?.keys?.[key];
  }

  /**
   * @deprecated
   */
  peekAttribute(identity, attribute) {
    deprecate$3("Cache#peekAttribute is deprecated. Instead of `cache.peekAttribute({ type, id }, attribute)`, call `cache.findRecord({ type, id })` and then access the record's fields directly.");
    const record = this.#sourceCache.getRecordSync(identity);
    return record?.attributes?.[attribute];
  }

  /**
   * @deprecated
   */
  peekRelatedRecord(identity, relationship) {
    deprecate$3("Cache#peekRelatedRecord is deprecated. Instead of `cache.peekRelatedRecord({ type, id }, relationship)`, call `cache.findRecord({ type, id })` and then access the record's fields directly.");
    const relatedRecord = this.#sourceCache.getRelatedRecordSync(identity, relationship);
    if (relatedRecord) {
      return this.lookup(relatedRecord);
    } else {
      return relatedRecord;
    }
  }

  /**
   * @deprecated
   */
  peekRelatedRecords(identity, relationship) {
    deprecate$3("Cache#peekRelatedRecords is deprecated. Instead of `cache.peekRelatedRecords({ type, id }, relationship)`, call `cache.findRecord({ type, id })` and then access the record's fields directly.");
    const relatedRecords = this.#sourceCache.getRelatedRecordsSync(identity, relationship);
    if (relatedRecords) {
      return relatedRecords.map(r => this.lookup(r));
    } else {
      return undefined;
    }
  }
  update(transformOrOperations, options, id) {
    assert$7(`You tried to update a cache that is not a fork, which is not allowed by default. Either fork the store/cache before making updates directly to the cache or, if the update you are making is ephemeral, set 'cache.allowUpdates = true' to override this assertion.`, this.allowUpdates);
    const transform = buildTransform(transformOrOperations, options, id, this.#sourceCache.transformBuilder);
    if (options?.fullResponse) {
      let response = this.#sourceCache.update(transform, {
        fullResponse: true
      });
      if (response.data !== undefined) {
        const data = this._lookupTransformResult(response.data, Array.isArray(transform.operations));
        response = {
          ...response,
          data
        };
      }
      return response;
    } else {
      let response = this.#sourceCache.update(transform);
      if (response !== undefined) {
        response = this._lookupTransformResult(response, Array.isArray(transform.operations));
      }
      return response;
    }
  }
  query(queryOrExpressions, options, id) {
    const query = buildQuery(queryOrExpressions, options, id, this.#sourceCache.queryBuilder);
    if (options?.fullResponse) {
      const response = this.#sourceCache.query(query, {
        fullResponse: true
      });
      const data = this._lookupQueryResult(response.data, Array.isArray(query.expressions));
      return {
        ...response,
        data
      };
    } else {
      const response = this.#sourceCache.query(query);
      const data = this._lookupQueryResult(response, Array.isArray(query.expressions));
      return data;
    }
  }
  liveQuery(queryOrExpressions, options, id) {
    const query = buildQuery(queryOrExpressions, options, id, this.#sourceCache.queryBuilder);
    const liveQuery = this.#sourceCache.liveQuery(query);
    return new LiveQuery({
      liveQuery,
      cache: this,
      query
    });
  }

  /**
   * @deprecated
   */
  find(type, id) {
    deprecate$3('`Cache#find` is deprecated. Call `cache.findRecords(type)`, `cache.findRecord(type, id)`, or `cache.query(...)` instead.');
    if (id === undefined) {
      return this.findRecords(type);
    } else {
      return this.findRecord(type, id);
    }
  }
  findRecord(typeOrIdentity, idOrOptions, options) {
    if (options?.fullResponse) {
      delete options.fullResponse;
    }
    let identity;
    let queryOptions;
    if (typeof typeOrIdentity === 'string') {
      if (typeof idOrOptions === 'string') {
        identity = {
          type: typeOrIdentity,
          id: idOrOptions
        };
        queryOptions = options;
      } else {
        throw new Assertion('`Cache#findRecord` may be called with either `type` and `id` strings OR a single `identity` object.');
      }
    } else {
      identity = typeOrIdentity;
      queryOptions = idOrOptions;
    }
    return this.query(q => q.findRecord(identity), queryOptions);
  }
  findRecords(typeOrIdentities, options) {
    if (options?.fullResponse) {
      delete options.fullResponse;
    }
    return this.query(q => q.findRecords(typeOrIdentities), options);
  }

  /**
   * Adds a record
   */
  addRecord(properties, options) {
    assert$7('Cache#addRecord does not support the `fullResponse` option. Call `cache.update(..., { fullResponse: true })` instead.', options?.fullResponse === undefined);
    return this.update(t => t.addRecord(properties), options);
  }

  /**
   * Updates a record
   */
  updateRecord(properties, options) {
    assert$7('Cache#updateRecord does not support the `fullResponse` option. Call `cache.update(..., { fullResponse: true })` instead.', options?.fullResponse === undefined);
    return this.update(t => t.updateRecord(properties), options);
  }

  /**
   * Removes a record
   */
  removeRecord(identity, options) {
    assert$7('Cache#removeRecord does not support the `fullResponse` option. Call `cache.update(..., { fullResponse: true })` instead.', options?.fullResponse === undefined);
    this.update(t => t.removeRecord(identity), options);
  }
  unload(identity) {
    const record = this._identityMap.get(identity);
    if (record) {
      record.$disconnect();
      this._identityMap.delete(identity);
    }
  }
  lookup(identity) {
    let record = this._identityMap.get(identity);
    if (!record) {
      record = this.#modelFactory.create(identity);
      this._identityMap.set(identity, record);
    }
    return record;
  }
  _lookupQueryResult(result, isArray) {
    if (isArray) {
      if (Array.isArray(result)) {
        return result.map(i => this.lookupQueryExpressionResult(i));
      } else {
        throw new Assertion('A resultset for a query with an array of `expressions` should also be an array.');
      }
    } else {
      return this.lookupQueryExpressionResult(result);
    }
  }
  _lookupTransformResult(result, isArray) {
    if (isArray) {
      if (Array.isArray(result)) {
        return result.map(i => this.lookupOperationResult(i));
      } else {
        throw new Assertion('A resultset for a transform with an array of `operations` should also be an array.');
      }
    } else {
      if (Array.isArray(result)) {
        throw new Assertion('A resultset for a transform with singular (i.e. non-array) `operations` should not be an array.');
      } else {
        return this.lookupOperationResult(result);
      }
    }
  }
  lookupQueryExpressionResult(result) {
    if (Array.isArray(result)) {
      return result.map(i => i ? this.lookup(i) : i);
    } else if (result) {
      return this.lookup(result);
    } else {
      return result;
    }
  }
  lookupOperationResult(result) {
    if (result) {
      return this.lookup(result);
    } else {
      return result;
    }
  }
  notifyPropertyChange(identity, property) {
    const record = this._identityMap.get(identity);
    record?.$notifyPropertyChange(property);
  }
  generatePatchListener() {
    return operation => {
      const record = operation.record;
      const {
        type,
        id,
        keys,
        attributes,
        relationships
      } = record;
      const identity = {
        type,
        id
      };
      switch (operation.op) {
        case 'updateRecord':
          for (const properties of [attributes, keys, relationships]) {
            if (properties) {
              for (const property of Object.keys(properties)) {
                if (Object.prototype.hasOwnProperty.call(properties, property)) {
                  this.notifyPropertyChange(identity, property);
                }
              }
            }
          }
          break;
        case 'replaceAttribute':
          this.notifyPropertyChange(identity, operation.attribute);
          break;
        case 'replaceKey':
          this.notifyPropertyChange(identity, operation.key);
          break;
        case 'replaceRelatedRecord':
        case 'replaceRelatedRecords':
        case 'addToRelatedRecords':
        case 'removeFromRelatedRecords':
          this.notifyPropertyChange(identity, operation.relationship);
          break;
        case 'removeRecord':
          this.unload(identity);
          break;
      }
    };
  }
}

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

const MODEL_DEFINITION = Symbol('@orbit:modelDefinition');
const MODEL_DEFINITION_FOR = Symbol('@orbit:modelDefinitionFor');
function getModelDefinition(proto) {
  if (proto[MODEL_DEFINITION]) {
    return proto[MODEL_DEFINITION];
  } else {
    proto[MODEL_DEFINITION] = {};
    return proto[MODEL_DEFINITION];
  }
}
function extendModelDefinition(proto, modelDefinition) {
  if (proto[MODEL_DEFINITION] && proto[MODEL_DEFINITION_FOR]) {
    let currentDef = proto[MODEL_DEFINITION];
    if (proto[MODEL_DEFINITION_FOR] !== proto) {
      currentDef = clone(currentDef);
      proto[MODEL_DEFINITION_FOR] = proto;
    }
    proto[MODEL_DEFINITION] = deepMerge(currentDef, modelDefinition);
  } else {
    proto[MODEL_DEFINITION] = modelDefinition;
    proto[MODEL_DEFINITION_FOR] = proto;
  }
}
function defineAttribute(proto, name, options) {
  extendModelDefinition(proto, {
    attributes: {
      [name]: options
    }
  });
}
function defineKey(proto, name, options) {
  extendModelDefinition(proto, {
    keys: {
      [name]: options
    }
  });
}
function defineRelationship(proto, name, options) {
  extendModelDefinition(proto, {
    relationships: {
      [name]: options
    }
  });
}

const {
  deprecate: deprecate$2
} = Orbit;
const values = new WeakMap();
const caches = new WeakMap();
class PropertyCache {
  static {
    g(this.prototype, "invalidate", [tracked], function () {
      return 0;
    });
  }
  #invalidate = (i(this, "invalidate"), void 0);
  #value;
  #getter;
  constructor(getter) {
    this.#getter = getter;
    this.#value = createCache(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      this.invalidate;
      if (values.has(this)) {
        return values.get(this);
      }
      return this.#getter();
    });
  }
  get value() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return getValue(this.#value);
  }
  set value(value) {
    values.set(this, value);
    this.invalidate++;
  }
  notifyPropertyChange() {
    values.delete(this);
    this.invalidate++;
  }
}
function notifyPropertyChange(record, property) {
  caches.get(record)?.[property]?.notifyPropertyChange();

  // TODO: there is an issue with glimmer cache and ember CP macros
  // https://github.com/ember-polyfills/ember-cache-primitive-polyfill/issues/78
  // in order to fix it for now we are calling Ember.notifyPropertyChange();
  notifyPropertyChange$1(record, property);
}
function getKeyCache(record, property) {
  let recordCaches = caches.get(record);
  if (recordCaches === undefined) {
    recordCaches = {};
    caches.set(record, recordCaches);
  }
  let propertyCache = recordCaches[property];
  if (propertyCache === undefined) {
    propertyCache = recordCaches[property] = new PropertyCache(() => record.$getKey(property));
  }
  return propertyCache;
}
function getAttributeCache(record, property) {
  let recordCaches = caches.get(record);
  if (recordCaches === undefined) {
    recordCaches = {};
    caches.set(record, recordCaches);
  }
  let propertyCache = recordCaches[property];
  if (propertyCache === undefined) {
    propertyCache = recordCaches[property] = new PropertyCache(() => record.$getAttribute(property));
  }
  return propertyCache;
}
function getHasOneCache(record, property) {
  let recordCaches = caches.get(record);
  if (recordCaches === undefined) {
    recordCaches = {};
    caches.set(record, recordCaches);
  }
  let propertyCache = recordCaches[property];
  if (propertyCache === undefined) {
    propertyCache = recordCaches[property] = new PropertyCache(() => record.$getRelatedRecord(property));
  }
  return propertyCache;
}
function getHasManyCache(record, property) {
  let recordCaches = caches.get(record);
  if (recordCaches === undefined) {
    recordCaches = {};
    caches.set(record, recordCaches);
  }
  let propertyCache = recordCaches[property];
  if (propertyCache === undefined) {
    propertyCache = recordCaches[property] = new PropertyCache(() => addLegacyMutationMethods(record, property, record.$getRelatedRecords(property) ?? []));
  }
  return propertyCache;
}
function addLegacyMutationMethods(owner, relationship, records) {
  if (DEBUG) {
    records = [...records];
  }
  Object.defineProperties(records, {
    pushObject: {
      value: record => {
        deprecate$2('pushObject(record) is deprecated. Use record.addToRelatedRecords(relationship, record)');
        owner.$addToRelatedRecords(relationship, record);
      }
    },
    removeObject: {
      value: record => {
        deprecate$2('removeObject(record) is deprecated. Use record.removeFromRelatedRecords(relationship, record)');
        owner.$removeFromRelatedRecords(relationship, record);
      }
    }
  });
  if (DEBUG) {
    return Object.freeze(records);
  }
  return records;
}

const {
  assert: assert$6,
  deprecate: deprecate$1
} = Orbit;
class Model {
  static {
    g(this.prototype, "_isDisconnected", [tracked], function () {
      return false;
    });
  }
  #_isDisconnected = (i(this, "_isDisconnected"), void 0);
  _cache;
  #identity;
  constructor(settings) {
    const {
      cache,
      identity
    } = settings;
    assert$6('Model must be initialized with a cache', cache !== undefined);
    this._cache = cache;
    this.#identity = identity;
    associateDestroyableChild(cache, this);
    registerDestructor(this, record => cache.unload(record));
  }
  get identity() {
    deprecate$1('`Model#identity` is deprecated to avoid potential conflicts with field names. Access `$identity` instead.');
    return this.#identity;
  }
  get $identity() {
    return this.#identity;
  }
  get id() {
    return this.#identity.id;
  }
  get type() {
    return this.#identity.type;
  }
  get disconnected() {
    deprecate$1('`Model#disconnected` is deprecated to avoid potential conflicts with field names. Access `$isDisconnected` instead.');
    return this.$isDisconnected;
  }
  get $isDisconnected() {
    return this._isDisconnected;
  }

  /**
   * @deprecated
   */
  getData() {
    deprecate$1('`Model#getData` is deprecated to avoid potential conflicts with field names. Call `$getData` instead.');
    return this.$getData();
  }
  $getData() {
    return this.$cache.getRecordData(this.type, this.id);
  }

  /**
   * @deprecated
   */
  getKey(field) {
    deprecate$1('`Model#getKey` is deprecated to avoid potential conflicts with field names. Call `$getKey` instead.');
    return this.$getKey(field);
  }
  $getKey(field) {
    return this.$getData()?.keys?.[field];
  }

  /**
   * @deprecated
   */
  replaceKey(key, value, options) {
    deprecate$1('`Model#replaceKey` is deprecated to avoid potential conflicts with field names. Call `$replaceKey` instead.');
    this.$replaceKey(key, value, options);
  }
  $replaceKey(key, value, options) {
    this.$cache.update(t => t.replaceKey(this.#identity, key, value), options);
  }

  /**
   * @deprecated
   */
  getAttribute(attribute) {
    deprecate$1('`Model#getAttribute` is deprecated to avoid potential conflicts with field names. Call `$getAttribute` instead.');
    return this.$getAttribute(attribute);
  }
  $getAttribute(attribute) {
    return this.$getData()?.attributes?.[attribute];
  }

  /**
   * @deprecated
   */
  replaceAttribute(attribute, value, options) {
    deprecate$1('`Model#replaceAttribute` is deprecated to avoid potential conflicts with field names. Call `$replaceAttribute` instead.');
    this.$replaceAttribute(attribute, value, options);
  }
  $replaceAttribute(attribute, value, options) {
    this.$cache.update(t => t.replaceAttribute(this.#identity, attribute, value), options);
  }

  /**
   * @deprecated
   */
  getRelatedRecord(relationship) {
    deprecate$1('`Model#getRelatedRecord` is deprecated to avoid potential conflicts with field names. Call `$getRelatedRecord` instead.');
    return this.$getRelatedRecord(relationship);
  }
  $getRelatedRecord(relationship) {
    const cache = this.$cache;
    const relatedRecord = cache.sourceCache.getRelatedRecordSync(this.#identity, relationship);
    if (relatedRecord) {
      return cache.lookup(relatedRecord);
    } else {
      return relatedRecord;
    }
  }

  /**
   * @deprecated
   */
  replaceRelatedRecord(relationship, relatedRecord, options) {
    deprecate$1('`Model#replaceRelatedRecord` is deprecated to avoid potential conflicts with field names. Call `$replaceRelatedRecord` instead.');
    this.$replaceRelatedRecord(relationship, relatedRecord, options);
  }
  $replaceRelatedRecord(relationship, relatedRecord, options) {
    this.$cache.update(t => t.replaceRelatedRecord(this.#identity, relationship, relatedRecord ? relatedRecord.$identity : null), options);
  }

  /**
   * @deprecated
   */
  getRelatedRecords(relationship) {
    deprecate$1('`Model#getRelatedRecords` is deprecated to avoid potential conflicts with field names. Call `$getRelatedRecords` instead.');
    return this.$getRelatedRecords(relationship);
  }
  $getRelatedRecords(relationship) {
    const cache = this.$cache;
    const relatedRecords = cache.sourceCache.getRelatedRecordsSync(this.#identity, relationship);
    if (relatedRecords) {
      return relatedRecords.map(r => cache.lookup(r));
    } else {
      return undefined;
    }
  }

  /**
   * @deprecated
   */
  addToRelatedRecords(relationship, record, options) {
    deprecate$1('`Model#addToRelatedRecords` is deprecated to avoid potential conflicts with field names. Call `$addToRelatedRecords` instead.');
    this.$addToRelatedRecords(relationship, record, options);
  }
  $addToRelatedRecords(relationship, record, options) {
    this.$cache.update(t => t.addToRelatedRecords(this.#identity, relationship, record.$identity), options);
  }

  /**
   * @deprecated
   */
  removeFromRelatedRecords(relationship, record, options) {
    deprecate$1('`Model#removeFromRelatedRecords` is deprecated to avoid potential conflicts with field names. Call `$removeFromRelatedRecords` instead.');
    this.$removeFromRelatedRecords(relationship, record, options);
  }
  $removeFromRelatedRecords(relationship, record, options) {
    this.$cache.update(t => t.removeFromRelatedRecords(this.#identity, relationship, record.$identity), options);
  }

  /**
   * @deprecated
   */
  replaceAttributes(properties, options) {
    deprecate$1('`Model#replaceAttributes` is deprecated. Call `$update` instead (with the same arguments).');
    this.$update(properties, options);
  }

  /**
   * @deprecated
   */
  update(properties, options) {
    deprecate$1('`Model#update` is deprecated to avoid potential conflicts with field names. Call `$update` instead.');
    this.$update(properties, options);
  }
  $update(properties, options) {
    this.$cache.update(t => t.updateRecord({
      ...properties,
      ...this.#identity
    }), options);
  }

  /**
   * @deprecated
   */
  remove(options) {
    deprecate$1('`Model#remove` is deprecated to avoid potential conflicts with field names. Call `$remove` instead.');
    this.$remove(options);
  }
  $remove(options) {
    this.$cache.update(t => t.removeRecord(this.#identity), options);
  }

  /**
   * @deprecated
   */
  disconnect() {
    deprecate$1('`Model#disconnect` is deprecated to avoid potential conflicts with field names. Call `$disconnect` instead.');
    this.$disconnect();
  }
  $disconnect() {
    this._cache = undefined;
    this._isDisconnected = true;
  }

  /**
   * @deprecated
   */
  destroy() {
    deprecate$1('`Model#destroy` is deprecated to avoid potential conflicts with field names. Call `$destroy` instead.');
    this.$destroy();
  }
  $destroy() {
    destroy(this);
  }

  /**
   * @deprecated
   */
  notifyPropertyChange(key) {
    deprecate$1('`Model#notifyPropertyChange` is deprecated to avoid potential conflicts with field names. Call `$notifyPropertyChange` instead.');
    this.$notifyPropertyChange(key);
  }
  $notifyPropertyChange(key) {
    notifyPropertyChange(this, key);
  }
  get $cache() {
    if (this._cache === undefined) {
      throw new Assertion('Record has been disconnected from its cache.');
    }
    return this._cache;
  }
  static get definition() {
    return getModelDefinition(this.prototype);
  }
  static get keys() {
    return getModelDefinition(this.prototype).keys ?? {};
  }
  static get attributes() {
    return getModelDefinition(this.prototype).attributes ?? {};
  }
  static get relationships() {
    return getModelDefinition(this.prototype).relationships ?? {};
  }
  static create(injections) {
    const {
      identity,
      cache,
      ...otherInjections
    } = injections;
    const record = new this({
      identity,
      cache
    });
    return Object.assign(record, otherInjections);
  }
}

const {
  assert: assert$5
} = Orbit;
function attr(typeOrDef, def) {
  let attrDef;
  if (typeof typeOrDef === 'string') {
    attrDef = def ?? {};
    attrDef.type = typeOrDef;
  } else {
    attrDef = typeOrDef ?? {};
    assert$5('@attr can be defined with a `type` and `definition` object but not two `definition` objects', def === undefined);
  }
  return (target, property) => {
    function get() {
      assert$5(`The ${this.type} record has been removed from its cache, so we cannot lookup the ${property} attribute.`, this._cache !== undefined);
      return getAttributeCache(this, property).value;
    }
    function set(value) {
      const oldValue = this.$getAttribute(property);
      if (value !== oldValue) {
        this.$replaceAttribute(property, value);
        getAttributeCache(this, property).value = value;
      }
    }
    defineAttribute(target, property, attrDef);
    return {
      get,
      set
    };
  };
}

const {
  assert: assert$4
} = Orbit;
function hasMany(typeOrDef, def) {
  let relDef;
  if (typeof typeOrDef === 'string' || Array.isArray(typeOrDef)) {
    relDef = def ?? {};
    relDef.type = typeOrDef;
  } else {
    relDef = typeOrDef;
    assert$4('@hasMany can be defined with a `type` and `definition` object but not two `definition` objects', def === undefined);
    assert$4('@hasMany() requires a `type` argument.', relDef?.type !== undefined);
  }
  relDef.kind = 'hasMany';
  return (target, property) => {
    function get() {
      assert$4(`The ${this.type} record has been removed from its cache, so we cannot lookup the ${property} hasMany relationship.`, this._cache !== undefined);
      return getHasManyCache(this, property).value;
    }
    defineRelationship(target, property, relDef);
    return {
      get
    };
  };
}

const {
  assert: assert$3
} = Orbit;
function hasOne(typeOrDef, def) {
  let relDef;
  if (typeof typeOrDef === 'string' || Array.isArray(typeOrDef)) {
    relDef = def ?? {};
    relDef.type = typeOrDef;
  } else {
    relDef = typeOrDef;
    assert$3('@hasOne can be defined with a `type` and `definition` object but not two `definition` objects', def === undefined);
    assert$3('@hasOne() requires a `type` argument.', relDef?.type !== undefined);
  }
  relDef.kind = 'hasOne';
  return (target, property) => {
    function get() {
      assert$3(`The ${this.type} record has been removed from its cache, so we cannot lookup the ${property} hasOne relationship.`, this._cache !== undefined);
      return getHasOneCache(this, property).value;
    }
    function set(value) {
      const oldValue = this.$getRelatedRecord(property);
      if (value !== oldValue) {
        this.$replaceRelatedRecord(property, value);
      }
    }
    defineRelationship(target, property, relDef);
    return {
      get,
      set
    };
  };
}

const {
  assert: assert$2
} = Orbit;
function key(options = {}) {
  return (target, property) => {
    function get() {
      assert$2(`The ${this.type} record has been removed from its cache, so we cannot lookup the ${property} key.`, this._cache !== undefined);
      return getKeyCache(this, property).value;
    }
    function set(value) {
      const oldValue = this.$getKey(property);
      if (value !== oldValue) {
        this.$replaceKey(property, value);
        getKeyCache(this, property).value = value;
      }
    }
    defineKey(target, property, options);
    return {
      get,
      set
    };
  };
}

function getDescriptor(serviceName) {
  return {
    get() {
      const owner = getOwner(this);
      const orbitRegistry = getOrbitRegistry(owner);
      const services = orbitRegistry.services;
      const service = services[serviceName];
      if (service === undefined) {
        throw new Error(`No orbit service named '${serviceName}' was found. Available services: ${Object.keys(services).join(', ')}`);
      }
      return service;
    },
    configurable: true,
    enumerable: true
  };
}

/**
 * Decorator that injects orbit services from the orbitRegistry
 * This provides an alternative to Ember's @service decorator that is decoupled from Ember's owner.
 *
 * Usage:
 * - @orbit declare dataCoordinator;
 * - @orbit('keyMap') declare myKeyMap;
 */
function orbit(nameOrTarget, propertyKey) {
  // Direct decorator usage: @orbit
  if (propertyKey !== undefined) {
    return getDescriptor(String(propertyKey));
  }

  // Factory decorator usage: @orbit() or @orbit('name')
  const name = nameOrTarget;
  return function (_target, propertyKey) {
    return getDescriptor(name ?? String(propertyKey));
  };
}

const {
  assert: assert$1,
  deprecate
} = Orbit;
/**
 * @class Store
 */
class Store {
  #source;
  #cache;
  #base;
  static create(injections) {
    return new this(injections);
  }
  constructor(settings) {
    this.#source = settings.source;
    this.#base = settings.base;
    const owner = getOwner(settings);
    setOwner(this, owner);
    const cacheSettings = {
      sourceCache: this.source.cache,
      store: this
    };
    setOwner(cacheSettings, owner);
    this.#cache = new Cache(cacheSettings);
    if (this.#base) {
      associateDestroyableChild(this.#base, this);
    }
    associateDestroyableChild(this, this.#cache);
  }
  destroy() {
    destroy(this);
  }
  get source() {
    return this.#source;
  }
  get cache() {
    return this.#cache;
  }
  get keyMap() {
    return this.source.keyMap;
  }
  get schema() {
    return this.source.schema;
  }
  get queryBuilder() {
    return this.source.queryBuilder;
  }
  get transformBuilder() {
    return this.source.transformBuilder;
  }
  get validatorFor() {
    return this.#source.validatorFor;
  }
  get defaultQueryOptions() {
    return this.source.defaultQueryOptions;
  }
  set defaultQueryOptions(options) {
    this.source.defaultQueryOptions = options;
  }
  get defaultTransformOptions() {
    return this.source.defaultTransformOptions;
  }
  set defaultTransformOptions(options) {
    this.source.defaultTransformOptions = options;
  }
  get transformLog() {
    return this.source.transformLog;
  }
  get requestQueue() {
    return this.source.requestQueue;
  }
  get syncQueue() {
    return this.source.syncQueue;
  }

  /**
   * @deprecated use `isForked` instead
   */
  get forked() {
    deprecate('Store#forked is deprecated. Access `isForked` instead.');
    return this.isForked;
  }
  get isForked() {
    return this.source.base !== undefined;
  }
  get base() {
    return this.#base;
  }
  fork(settings = {}) {
    settings.cacheSettings ??= {};
    settings.cacheSettings.debounceLiveQueries ??= false;
    const forkedSource = this.source.fork(settings);
    const injections = getOwner(this).ownerInjection();
    return new Store({
      ...injections,
      source: forkedSource,
      base: this
    });
  }
  async merge(forkedStore, options) {
    if (options?.fullResponse) {
      let response = await this.source.merge(forkedStore.source, options);
      if (response.data !== undefined) {
        const data = this.cache._lookupTransformResult(response.data, true // merge results should ALWAYS be an array
        );
        response = {
          ...response,
          data
        };
      }
      return response;
    } else {
      let response = await this.source.merge(forkedStore.source, options);
      if (response !== undefined) {
        response = this.cache._lookupTransformResult(response, true // merge results should ALWAYS be an array
        );
      }
      return response;
    }
  }
  rollback(transformId, relativePosition) {
    return this.source.rollback(transformId, relativePosition);
  }
  rebase() {
    this.source.rebase();
  }
  reset() {
    return this.source.reset();
  }

  /**
   * @deprecated
   */
  async liveQuery(queryOrExpressions, options, id) {
    deprecate('Store#liveQuery is deprecated. Call `let lq = store.cache.liveQuery(query)` instead. If you want to await the same query on the store, call `await store.query(lq.query);');
    const query = buildQuery(queryOrExpressions, options, id, this.source.queryBuilder);
    await this.source.query(query);
    return this.cache.liveQuery(query);
  }
  async query(queryOrExpressions, options, id) {
    const query = buildQuery(queryOrExpressions, options, id, this.source.queryBuilder);
    if (options?.fullResponse) {
      const response = await this.source.query(query, {
        fullResponse: true
      });
      return {
        ...response,
        data: this.cache._lookupQueryResult(response.data, Array.isArray(query.expressions))
      };
    } else {
      const response = await this.source.query(query);
      const data = this.cache._lookupQueryResult(response, Array.isArray(query.expressions));
      return data;
    }
  }

  /**
   * Adds a record
   */
  async addRecord(properties, options) {
    assert$1('Store#addRecord does not support the `fullResponse` option. Call `store.update(..., { fullResponse: true })` instead.', options?.fullResponse === undefined);
    return await this.update(t => t.addRecord(properties), options);
  }

  /**
   * Updates a record
   */
  async updateRecord(properties, options) {
    assert$1('Store#updateRecord does not support the `fullResponse` option. Call `store.update(..., { fullResponse: true })` instead.', options?.fullResponse === undefined);
    return await this.update(t => t.updateRecord(properties), options);
  }

  /**
   * Updates a record's fields. Distinct from updateRecord in that updateRecordFields takes a record identity as a separate argument
   * from the fields to update.
   */
  async updateRecordFields(identity, fields, options) {
    assert$1('Store#updateRecordFields does not support the `fullResponse` option. Call `store.update(..., { fullResponse: true })` instead.', options?.fullResponse === undefined);
    const {
      type,
      id
    } = this.transformBuilder.$normalizeRecordIdentity(identity);
    const properties = {
      type,
      id,
      ...fields
    };
    return await this.update(t => t.updateRecord(properties), options);
  }

  /**
   * Removes a record
   */
  async removeRecord(identity, options) {
    assert$1('Store#removeRecord does not support the `fullResponse` option. Call `store.update(..., { fullResponse: true })` instead.', options?.fullResponse === undefined);
    await this.update(t => t.removeRecord(identity), options);
  }

  /**
   * @deprecated
   */
  find(type, id, options) {
    deprecate('Store#find is deprecated. Call `store.findRecords(type)`, `store.findRecord(type, id)`, or `store.query(...)` instead.');
    if (id === undefined) {
      return this.findRecords(type, options);
    } else {
      return this.findRecord(type, id, options);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars

  // eslint-disable-next-line @typescript-eslint/no-unused-vars

  async findRecord(typeOrIdentity, idOrOptions, options) {
    if (options?.fullResponse) {
      delete options.fullResponse;
    }
    let identity;
    let queryOptions;
    if (typeof typeOrIdentity === 'string') {
      if (typeof idOrOptions === 'string') {
        identity = {
          type: typeOrIdentity,
          id: idOrOptions
        };
        queryOptions = options;
      } else {
        throw new Assertion('Store#findRecord may be called with either `type` and `id` strings OR a single `identity` object.');
      }
    } else {
      identity = typeOrIdentity;
      queryOptions = idOrOptions;
    }
    return await this.query(q => q.findRecord(identity), queryOptions);
  }
  async findRecords(typeOrIdentities, options) {
    if (options?.fullResponse) {
      delete options.fullResponse;
    }
    return await this.query(q => q.findRecords(typeOrIdentities), options);
  }

  /**
   * @deprecated
   */
  async findRecordByKey(type, key, value, options) {
    deprecate('Store#findRecordByKey is deprecated. Instead of `store.findRecordByKey(type, key, value)`, call `store.findRecord({ type, key, value })` or `store.query(...)`.');
    return this.findRecord({
      type,
      key,
      value
    }, options);
  }

  /**
   * @deprecated
   */
  peekRecord(type, id) {
    deprecate('Store#peekRecord is deprecated. Instead of `store.peekRecord(type, id)`, call `store.cache.findRecord(type, id)` or `store.cache.query(...)`.');
    return this.cache.findRecord(type, id);
  }

  /**
   * @deprecated
   */
  peekRecords(type) {
    deprecate('Store#peekRecords is deprecated. Instead of `store.peekRecords(type)`, call `store.cache.findRecords(type)` or `store.cache.query(...)`.');
    return this.cache.findRecords(type);
  }

  /**
   * @deprecated
   */
  peekRecordByKey(type, key, value) {
    deprecate('Store#peekRecordByKey is deprecated. Instead of `store.peekRecordByKey(type, key, value)`, call `store.cache.findRecord({ type, key, value })` or `store.cache.query(...)`.');
    return this.cache.findRecord({
      type,
      key,
      value
    });
  }
  on(event, listener) {
    this.source.on(event, listener);
  }
  off(event, listener) {
    this.source.off(event, listener);
  }
  one(event, listener) {
    this.source.one(event, listener);
  }
  async sync(transformOrTransforms) {
    await this.source.sync(transformOrTransforms);
  }
  async update(transformOrOperations, options, id) {
    const transform = buildTransform(transformOrOperations, options, id, this.source.transformBuilder);
    if (options?.fullResponse) {
      let response = await this.source.update(transform, {
        fullResponse: true
      });
      if (response.data !== undefined) {
        const data = this.cache._lookupTransformResult(response.data, Array.isArray(transform.operations));
        response = {
          ...response,
          data
        };
      }
      return response;
    } else {
      let response = await this.source.update(transform);
      if (response !== undefined) {
        response = this.cache._lookupTransformResult(response, Array.isArray(transform.operations));
      }
      return response;
    }
  }
  transformsSince(transformId) {
    deprecate('`Store#transformsSince` is deprecated. Call `getTransformsSince` instead.');
    return this.getTransformsSince(transformId);
  }
  getTransformsSince(transformId) {
    return this.source.getTransformsSince(transformId);
  }
  allTransforms() {
    deprecate('`Store#allTransforms` is deprecated. Call `getAllTransforms` instead.');
    return this.getAllTransforms();
  }
  getAllTransforms() {
    return this.source.getAllTransforms();
  }
  getTransform(transformId) {
    return this.source.getTransform(transformId);
  }
  getInverseOperations(transformId) {
    return this.source.getInverseOperations(transformId);
  }
}

var DataCoordinator = {
  create(injections = {}) {
    const owner = getOwner(injections);
    const orbitRegistry = getOrbitRegistry(owner);
    const sourceNames = Object.keys(orbitRegistry.registrations.sources);
    injections.sources = sourceNames.map(name => {
      return orbitRegistry.registrations.sources[name];
    }).filter(source => !!source);
    const strategyNames = Object.keys(orbitRegistry.registrations.strategies);
    injections.strategies = strategyNames.map(name => {
      return orbitRegistry.registrations.strategies[name];
    }).filter(strategy => !!strategy);
    return new Coordinator(injections);
  }
};

var DataKeyMap = {
  create() {
    return new RecordKeyMap();
  }
};

const {
  assert
} = Orbit;
function normalizeModelFields(schema, properties) {
  const {
    id,
    type
  } = properties;
  const modelDefinition = schema.getModel(type);
  const record = {
    id,
    type
  };
  assignKeys(modelDefinition, record, properties);
  assignAttributes(modelDefinition, record, properties);
  assignRelationships(modelDefinition, record, properties);
  return record;
}
function assignKeys(modelDefinition, record, properties) {
  const keyDefs = modelDefinition.keys;
  if (keyDefs) {
    for (const key of Object.keys(keyDefs)) {
      if (properties[key] !== undefined) {
        deepSet(record, ['keys', key], properties[key]);
      }
    }
  }
}
function assignAttributes(modelDefinition, record, properties) {
  const attributeDefs = modelDefinition.attributes;
  if (attributeDefs) {
    for (const attribute of Object.keys(attributeDefs)) {
      if (properties[attribute] !== undefined) {
        deepSet(record, ['attributes', attribute], properties[attribute]);
      }
    }
  }
}
function assignRelationships(modelDefinition, record, properties) {
  const relationshipDefs = modelDefinition.relationships;
  if (relationshipDefs) {
    for (const relationship of Object.keys(relationshipDefs)) {
      if (properties[relationship] !== undefined) {
        const relationshipDef = relationshipDefs[relationship];
        const relationshipType = relationshipDef.type;
        const relationshipProperties = properties[relationship];
        deepSet(record, ['relationships', relationship], normalizeRelationship(relationshipType, relationshipProperties));
      }
    }
  }
}
function normalizeRelationship(type, value) {
  const relationship = {};
  const isPolymorphic = Array.isArray(type);
  if (isHasMany(value)) {
    relationship.data = [];
    for (const identity of value) {
      if (typeof identity === 'string') {
        assert('The hasMany relationship is polymorphic, so string[] will not work as a value. RecordIdentity[] must be provided for type information.', !isPolymorphic);
        relationship.data.push({
          type: type,
          id: identity
        });
      } else {
        relationship.data.push({
          type: identity.type,
          id: identity.id
        });
      }
    }
  } else if (value === null) {
    relationship.data = null;
  } else if (typeof value === 'string') {
    assert('The relationship is polymorphic, so string will not work as a value. RecordIdentity must be provided for type information.', !isPolymorphic);
    relationship.data = {
      type: type,
      id: value
    };
  } else {
    relationship.data = {
      type: value.type,
      id: value.id
    };
  }
  return relationship;
}
function isHasMany(value) {
  return Array.isArray(value);
}

function isStandardRecord(data) {
  return data.attributes !== null && typeof data.attributes === 'object' || data.keys !== null && typeof data.keys === 'object' || data.relationships !== null && typeof data.relationships === 'object';
}
class ModelAwareNormalizer {
  _normalizer;
  constructor(settings) {
    this._normalizer = new StandardRecordNormalizer(settings);
  }
  get keyMap() {
    return this._normalizer.keyMap;
  }
  get schema() {
    return this._normalizer.schema;
  }
  normalizeRecordType(type) {
    return this._normalizer.normalizeRecordType(type);
  }
  normalizeRecordIdentity(identity) {
    if (identity instanceof Model) {
      return identity.$identity;
    } else {
      return this._normalizer.normalizeRecordIdentity(identity);
    }
  }
  normalizeRecord(record) {
    if (record instanceof Model) {
      const data = record.$getData();
      if (data === undefined) {
        throw new Error('Model is no longer in the cache');
      } else {
        return data;
      }
    }
    const uninitializedRecord = isStandardRecord(record) ? record : normalizeModelFields(this._normalizer.schema, record);
    return this._normalizer.normalizeRecord(uninitializedRecord);
  }
}

var DataNormalizer = {
  create(injections) {
    const owner = getOwner(injections);
    const orbitRegistry = getOrbitRegistry(owner);
    injections.keyMap = orbitRegistry.services.dataKeyMap;
    injections.schema = orbitRegistry.services.dataSchema;
    return new ModelAwareNormalizer(injections);
  }
};

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
var DataSchema = {
  create(injections = {}) {
    const owner = getOwner$1(injections);
    const orbitRegistry = getOrbitRegistry(owner);
    if (injections.models === undefined) {
      let modelNames;
      if (injections.modelNames) {
        modelNames = injections.modelNames;
        delete injections.modelNames;
      } else {
        modelNames = orbitRegistry.getRegisteredModels();
      }
      injections.models = {};
      for (const name of modelNames) {
        // @ts-expect-error TODO: fix these types
        const {
          keys,
          attributes,
          relationships
        } = orbitRegistry.registrations.models[name];
        injections.models[name] = {
          keys,
          attributes,
          relationships
        };
      }
    }
    injections.version ??= orbitRegistry.schemaVersion;
    return new RecordSchema(injections);
  }
};

var DataValidator = {
  create(injections) {
    return buildRecordValidatorFor(injections);
  }
};

var StoreService = {
  create(injections) {
    const owner = getOwner(injections);
    const orbitRegistry = getOrbitRegistry(owner);
    injections.source = orbitRegistry.registrations.sources['store'];
    return Store.create(injections);
  }
};

function getName(path) {
  if (path.includes('.')) {
    return path.substring(0, path.lastIndexOf('.'));
  }
  return path;
}

function registerDataBuckets(orbitRegistry, owner, modules) {
  const registry = orbitRegistry.registrations.buckets;
  const matches = Object.entries(modules);
  if (matches.length > 1) {
    throw new Error(`Expected only one file under /data-buckets/, found ${matches.length}: ` + matches.map(([key]) => key).join(', '));
  }
  for (const [, module] of matches) {
    const bucketSettings = {};
    setOwner(bucketSettings, owner);
    registry['main'] = module.default?.create?.(bucketSettings);
  }
}
function registerDataModels(orbitRegistry, modules) {
  const folder = '/data-models/';
  const registry = orbitRegistry.registrations.models;
  for (const [key, module] of Object.entries(modules)) {
    let [, name] = key.split(folder);
    name = getName(name);
    registry[name] = module.default ?? module;
  }
}
function registerDataSources(orbitRegistry, owner, modules) {
  const folder = '/data-sources/';
  const registry = orbitRegistry.registrations.sources;
  for (const [key, module] of Object.entries(modules)) {
    let [, name] = key.split(folder);
    name = getName(name);
    const sourceSettings = {};
    setOwner(sourceSettings, owner);
    registry[name] = module.default?.create?.(sourceSettings);
  }
}
function registerDataStrategies(orbitRegistry, owner, modules) {
  const folder = '/data-strategies/';
  const registry = orbitRegistry.registrations.strategies;
  for (const [key, module] of Object.entries(modules)) {
    let [, name] = key.split(folder);
    name = getName(name);
    const strategySettings = {};
    setOwner(strategySettings, owner);
    registry[name] = module.default?.create?.(strategySettings);
  }
}

/**
 * Registers the "injectable" services needed to inject into
 * the `injections` of all the other things.
 */
function registerInjectableServices(orbitRegistry, owner) {
  const keyMap = DataKeyMap.create();
  orbitRegistry.services.dataKeyMap = keyMap;
  const schemaSettings = {};
  setOwner(schemaSettings, owner);
  const schema = DataSchema.create(schemaSettings);
  orbitRegistry.services.dataSchema = schema;
  const normalizerSettings = {
    keyMap,
    schema
  };
  setOwner(normalizerSettings, owner);
  orbitRegistry.services.dataNormalizer = DataNormalizer.create(normalizerSettings);
  const validatorSettings = {
    validators: {}
  };
  setOwner(validatorSettings, owner);
  orbitRegistry.services.dataValidator = DataValidator.create(validatorSettings);
}
function registerModules(orbitRegistry, owner, modules) {
  const bucketModules = {};
  const modelModules = {};
  const sourceModules = {};
  const strategyModules = {};
  for (const [key, module] of Object.entries(modules)) {
    if (key.includes('/data-buckets/')) {
      bucketModules[key] = module;
    } else if (key.includes('/data-models/')) {
      modelModules[key] = module;
    } else if (key.includes('/data-sources/')) {
      sourceModules[key] = module;
    } else if (key.includes('/data-strategies/')) {
      strategyModules[key] = module;
    }
  }
  // Create buckets and models first because they do not need anything injected.
  registerDataBuckets(orbitRegistry, owner, bucketModules);
  registerDataModels(orbitRegistry, modelModules);
  // Register the services we need to inject into all the other things.
  registerInjectableServices(orbitRegistry, owner);
  // Then register the sources themselves
  registerDataSources(orbitRegistry, owner, sourceModules);
  registerDataStrategies(orbitRegistry, owner, strategyModules);
  const storeSourceSettings = {};
  setOwner(storeSourceSettings, owner);
  // Register the store source after registering all modules
  orbitRegistry.registrations.sources['store'] = MemorySourceFactory.create(storeSourceSettings);
  const storeSettings = {};
  setOwner(storeSettings, owner);
  orbitRegistry.services.store = StoreService.create(storeSettings);
  const coordinatorSettings = {};
  setOwner(coordinatorSettings, owner);
  // IMPORTANT: Do not move this. The coordinator always needs to be registed last.
  orbitRegistry.services.dataCoordinator = DataCoordinator.create(coordinatorSettings);
}
function setupOrbit(owner, modules, config) {
  const orbitRegistry = getOrbitRegistry(owner);
  orbitRegistry.schemaVersion = config?.schemaVersion;
  registerModules(orbitRegistry, owner, modules);
  return orbitRegistry;
}

export { Cache, LiveQuery, MemorySourceFactory, Model, Store, MemorySourceFactory as StoreFactory, applyStandardSourceInjections, attr, getOrbitRegistry, hasMany, hasOne, key, orbit, setupOrbit };
//# sourceMappingURL=index.js.map
