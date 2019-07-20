import { getOwner, setOwner } from '@ember/application';

import {
  buildQuery,
  QueryOrExpression,
  RecordIdentity,
  Transform,
  TransformOrOperations,
  cloneRecordIdentity,
  RecordOperation
} from '@orbit/data';
import MemorySource from '@orbit/memory';
import Orbit, { Log, TaskQueue, Listener } from '@orbit/core';
import Cache from './cache';
import Model from './model';
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

  static create(injections: StoreSettings): Store {
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

  fork(): Store {
    const forkedSource = this.source.fork();
    const injections = getOwner(this).ownerInjection();

    return Store.create({ ...injections, source: forkedSource });
  }

  merge(forkedStore: Store, options = {}): Promise<any> {
    return this.source.merge(forkedStore.source, options);
  }

  rollback(transformId: string, relativePosition?: number): Promise<void> {
    return this.source.rollback(transformId, relativePosition);
  }

  liveQuery(
    queryOrExpression: QueryOrExpression,
    options?: object,
    id?: string
  ): Promise<any> {
    const query = buildQuery(
      queryOrExpression,
      options,
      id,
      this.source.queryBuilder
    );
    return this.source.query(query).then(() => this.cache.liveQuery(query));
  }

  async query(
    queryOrExpression: QueryOrExpression,
    options?: object,
    id?: string
  ): Promise<any> {
    const query = buildQuery(
      queryOrExpression,
      options,
      id,
      this.source.queryBuilder
    );
    const result = await this.source.query(query);
    return this.cache.lookup(result);
  }

  async addRecord(properties = {}, options?: object): Promise<Model> {
    let record = normalizeRecordProperties(this.source.schema, properties);
    await this.update(t => t.addRecord(record), options);
    return this.cache.lookup(record) as Model;
  }

  async updateRecord(properties = {}, options?: object): Promise<Model> {
    let record = normalizeRecordProperties(this.source.schema, properties);
    await this.update(t => t.updateRecord(record), options);
    return this.cache.lookup(record) as Model;
  }

  async removeRecord(record: RecordIdentity, options?: object): Promise<void> {
    const identity = cloneRecordIdentity(record);
    await this.update(t => t.removeRecord(identity), options);
  }

  findAll(type: string, options?: object): Promise<Model[]> {
    deprecate(
      '`Store.findAll(type)` is deprecated, use `Store.findRecords(type)`.'
    );
    return this.findRecords(type, options);
  }

  find(type: string, id?: string | undefined): Promise<Model | Model[]> {
    if (id === undefined) {
      return this.findRecords(type);
    } else {
      return this.findRecord(type, id);
    }
  }

  findRecord(type: string, id: string, options?: object): Promise<Model> {
    return this.query(q => q.findRecord({ type, id }), options);
  }

  findRecords(type: string, options?: object): Promise<Model[]> {
    return this.query(q => q.findRecords(type), options);
  }

  peekRecord(type: string, id: string): Model | undefined {
    return this.cache.peekRecord(type, id);
  }

  peekRecords(type: string): Model[] {
    return this.cache.peekRecords(type);
  }

  findRecordByKey(
    type: string,
    keyName: string,
    keyValue: string,
    options?: object
  ): Promise<Model> {
    return this.findRecord(
      type,
      this.cache.recordIdFromKey(type, keyName, keyValue),
      options
    );
  }

  on(event: string, listener: Listener): void {
    this.source.on(event, listener);
  }

  off(event: string, listener: Listener): void {
    this.source.off(event, listener);
  }

  one(event: string, listener: Listener): void {
    this.source.one(event, listener);
  }

  sync(transformOrTransforms: Transform | Transform[]): Promise<void> {
    return this.source.sync(transformOrTransforms);
  }

  update(
    transformOrTransforms: TransformOrOperations,
    options?: object,
    id?: string
  ): Promise<any> {
    return this.source.update(transformOrTransforms, options, id);
  }

  getTransform(transformId: string): Transform {
    return this.source.getTransform(transformId);
  }

  getInverseOperations(transformId: string): RecordOperation[] {
    return this.source.getInverseOperations(transformId);
  }
}
