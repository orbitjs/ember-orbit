import { getOwner, setOwner } from '@ember/application';
import { notifyPropertyChange } from '@ember/object';

import {
  buildQuery, QueryOrExpression, RecordIdentity, Transform, TransformBuilder, TransformOrOperations, RecordOperation, Record
} from '@orbit/data';
import MemorySource, { MemoryCache } from '@orbit/memory';
import Orbit, { Log, TaskQueue, Listener } from '@orbit/core';

import Cache from './cache';
import IdentityMap from './identity-map';
import ModelFactory from './model-factory';
import normalizeRecordProperties from './utils/normalize-record-properties';

const { deprecate } = Orbit;

export interface StoreSettings {
  source: MemorySource
}

export default class Store {
  source: MemorySource;
  cache: Cache;
  identityMap: IdentityMap;

  transformLog: Log;
  requestQueue: TaskQueue;
  syncQueue: TaskQueue;

  private _listener: Listener;

  static create(injections: StoreSettings) {
    const owner = getOwner(injections);
    const store = new this(injections);
    setOwner(store, owner);
    return store;
  }

  constructor(settings: StoreSettings) {
    const source = settings.source;

    this.transformLog = source.transformLog;
    this.requestQueue = source.requestQueue;
    this.syncQueue = source.syncQueue;

    const sourceCache: MemoryCache = source.cache
    const factory = new ModelFactory(this);

    this.identityMap = new IdentityMap({ factory });

    this.source = source;
    this.cache = new Cache(source.cache, this.identityMap);

    this._listener = this.generateListener();
    sourceCache.on('patch', this._listener);
  }

  destroy() {
    this.willDestroy();
  }

  protected willDestroy() {
    if (this.source) {
      if (this.source.cache) {
        this.source.cache.off('patch', this._listener);
      }
      delete this.source;
    }

    delete this.cache;

    this.identityMap.deactivate();
    delete this.identityMap;

    delete this.transformLog;
    delete this.requestQueue;
    delete this.syncQueue;
  }

  fork() {
    const forkedSource = this.source.fork();
    const injections = getOwner(this).ownerInjection();

    return Store.create({ ...injections, source: forkedSource });
  }

  merge(forkedStore: Store, options = {}) {
    return this.source.merge(forkedStore.source, options);
  }

  rollback(transformId: string, relativePosition?: number) {
    return this.source.rollback(transformId, relativePosition);
  }

  liveQuery(queryOrExpression: QueryOrExpression, options?: object, id?: string) {
    const query = buildQuery(queryOrExpression, options, id, this.source.queryBuilder);
    return this.source.query(query)
      .then(() => this.cache.liveQuery(query));
  }

  query(queryOrExpression: QueryOrExpression, options?: object, id?: string) {
    const query = buildQuery(queryOrExpression, options, id, this.source.queryBuilder);
    return this.source.query(query)
      .then(result => this.identityMap.lookupQueryResult(query, result));
  }

  addRecord(properties = {}, options?: object) {
    let record = normalizeRecordProperties(this.source.schema, properties);
    return this.update(t => t.addRecord(record), options)
      .then(() => this.identityMap.lookup(record));
  }

  findAll(type: string, options?: object) {
    deprecate('`Store.findAll(type)` is deprecated, use `Store.findRecords(type)`.');
    return this.findRecords(type, options);
  }

  find(type: string, id?: string | undefined) {
    if (id === undefined) {
      return this.findRecords(type);
    } else {
      return this.findRecord(type, id);
    }
  }

  findRecord(type: string, id: string, options?: object) {
    return this.query(q => q.findRecord({ type, id }), options);
  }

  findRecords(type: string, options?: object) {
    return this.query(q => q.findRecords(type), options);
  }

  peekRecord(type: string, id: string, options?: object) {
    return this.cache.findRecord(type, id, options);
  }

  peekRecords(type: string, options?: object) {
    return this.cache.findRecords(type, options);
  }

  findRecordByKey(type: string, keyName: string, keyValue: string, options?: object) {
    let keyMap = this.source.keyMap;
    let id = keyMap.keyToId(type, keyName, keyValue);
    if (!id) {
      id = this.source.schema.generateId(type);
      keyMap.pushRecord({ type, id, keys: { [keyName]: keyValue } });
    }
    return this.findRecord(type, id, options);
  }

  removeRecord(identity: RecordIdentity, options?: object) {
    const { type, id } = identity;
    return this.update((t: TransformBuilder) => t.removeRecord({ type, id }), options);
  }

  on(event: string, listener: Listener) {
    return this.source.on(event, listener);
  }

  off(event: string, listener: Listener) {
    return this.source.off(event, listener);
  }

  one(event: string, listener: Listener) {
    return this.source.one(event, listener);
  }

  sync(transformOrTransforms: Transform | Transform[]) {
    return this.source.sync(transformOrTransforms);
  }

  update(transformOrTransforms: TransformOrOperations, options?: object, id?: string) {
    return this.source.update(transformOrTransforms, options, id);
  }

  getTransform(transformId: string) {
    return this.source.getTransform(transformId);
  }

  getInverseOperations(transformId: string) {
    return this.source.getInverseOperations(transformId);
  }

  protected notifyPropertyChange(identity: RecordIdentity, property: string) {
    if (this.identityMap.has(identity)) {
      const record = this.identityMap.lookup(identity) as object;
      notifyPropertyChange(record, property);
    }
  }

  private generateListener() {
    return (operation: RecordOperation) => {
      const record = operation.record as Record;
      const { type, id, keys, attributes, relationships } = record;
      const identity = { type, id };

      switch(operation.op) {
        case 'updateRecord':
          for (let properties of [attributes, keys, relationships]) {
            if (properties) {
              for (let property of Object.keys(properties)) {
                if (properties.hasOwnProperty(property)) {
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
          this.notifyPropertyChange(identity, operation.relationship);
          break;
        case 'removeRecord':
          this.identityMap.evict(identity);
          break;
      }
    };
  }
}
