import { getOwner, setOwner } from '@ember/application';

import {
  buildQuery,
  QueryOrExpression,
  RecordIdentity,
  Transform,
  TransformOrOperations,
  cloneRecordIdentity
} from '@orbit/data';
import MemorySource from '@orbit/memory';
import Orbit, { Log, TaskQueue, Listener } from '@orbit/core';

import Cache from './cache';
import ModelFactory from './model-factory';
import normalizeRecordProperties from './utils/normalize-record-properties';

const { deprecate } = Orbit;

export interface StoreSettings {
  source: MemorySource;
}

export default class Store {
  source: MemorySource;
  cache: Cache;

  transformLog: Log;
  requestQueue: TaskQueue;
  syncQueue: TaskQueue;

  static create(injections: StoreSettings) {
    const owner = getOwner(injections);
    const store = new this(injections);
    setOwner(store, owner);
    return store;
  }

  constructor(settings: StoreSettings) {
    this.source = settings.source;

    this.cache = new Cache({
      sourceCache: this.source.cache,
      modelFactory: new ModelFactory(this)
    });

    this.transformLog = this.source.transformLog;
    this.requestQueue = this.source.requestQueue;
    this.syncQueue = this.source.syncQueue;
  }

  destroy() {
    this.cache.destroy();

    delete this.source;
    delete this.cache;
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

  liveQuery(
    queryOrExpression: QueryOrExpression,
    options?: object,
    id?: string
  ) {
    const query = buildQuery(
      queryOrExpression,
      options,
      id,
      this.source.queryBuilder
    );
    return this.source.query(query).then(() => this.cache.liveQuery(query));
  }

  query(queryOrExpression: QueryOrExpression, options?: object, id?: string) {
    const query = buildQuery(
      queryOrExpression,
      options,
      id,
      this.source.queryBuilder
    );
    return this.source.query(query).then(result => this.cache.lookup(result));
  }

  addRecord(properties = {}, options?: object) {
    let record = normalizeRecordProperties(this.source.schema, properties);
    return this.update(t => t.addRecord(record), options).then(() =>
      this.cache.lookup(record)
    );
  }

  updateRecord(properties = {}, options?: object) {
    let record = normalizeRecordProperties(this.source.schema, properties);
    return this.update(t => t.updateRecord(record), options);
  }

  removeRecord(record: RecordIdentity, options?: object) {
    const identity = cloneRecordIdentity(record);
    return this.update(t => t.removeRecord(identity), options);
  }

  findAll(type: string, options?: object) {
    deprecate(
      '`Store.findAll(type)` is deprecated, use `Store.findRecords(type)`.'
    );
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

  findRecordByKey(
    type: string,
    keyName: string,
    keyValue: string,
    options?: object
  ) {
    let keyMap = this.source.keyMap;
    let id = keyMap.keyToId(type, keyName, keyValue);
    if (!id) {
      id = this.source.schema.generateId(type);
      keyMap.pushRecord({ type, id, keys: { [keyName]: keyValue } });
    }
    return this.findRecord(type, id, options);
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

  update(
    transformOrTransforms: TransformOrOperations,
    options?: object,
    id?: string
  ) {
    return this.source.update(transformOrTransforms, options, id);
  }

  getTransform(transformId: string) {
    return this.source.getTransform(transformId);
  }

  getInverseOperations(transformId: string) {
    return this.source.getInverseOperations(transformId);
  }
}
