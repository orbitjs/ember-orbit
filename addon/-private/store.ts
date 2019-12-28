import { getOwner, setOwner } from '@ember/application';

import {
  buildQuery,
  QueryOrExpression,
  RecordIdentity,
  Transform,
  TransformOrOperations,
  cloneRecordIdentity,
  RecordOperation,
  KeyMap,
  Schema,
  TransformBuilder
} from '@orbit/data';
import MemorySource from '@orbit/memory';
import Orbit, { Log, TaskQueue, Listener } from '@orbit/core';
import Cache from './cache';
import Model from './model';
import ModelFactory from './model-factory';
import normalizeRecordProperties from './utils/normalize-record-properties';
import {
  FindRecordQueryBuilder,
  FindRecordsQueryBuilder,
  FindRelatedRecordQueryBuilder,
  FindRelatedRecordsQueryBuilder
} from './query-builders';

const { deprecate } = Orbit;

export interface StoreSettings {
  source: MemorySource;
}

export default class Store {
  private _source: MemorySource;
  private _cache: Cache;

  static create(injections: StoreSettings): Store {
    const owner = getOwner(injections);
    const store = new this(injections);
    setOwner(store, owner);
    return store;
  }

  constructor(settings: StoreSettings) {
    this._source = settings.source;

    this._cache = new Cache({
      sourceCache: this.source.cache,
      modelFactory: new ModelFactory(this)
    });
  }

  destroy() {
    this._cache.destroy();
    delete this._source;
    delete this._cache;
  }

  get source(): MemorySource {
    return this._source;
  }

  get cache(): Cache {
    return this._cache;
  }

  get keyMap(): KeyMap | undefined {
    return this.source.keyMap;
  }

  get schema(): Schema {
    return this.source.schema;
  }

  get transformBuilder(): TransformBuilder {
    return this.source.transformBuilder;
  }

  get transformLog(): Log {
    return this.source.transformLog;
  }

  get requestQueue(): TaskQueue {
    return this.source.requestQueue;
  }

  get syncQueue(): TaskQueue {
    return this.source.syncQueue;
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

  rebase(): void {
    this.source.rebase();
  }

  /**
   * @deprecated
   */
  liveQuery(
    queryOrExpression: QueryOrExpression,
    options?: object,
    id?: string
  ): Promise<any> {
    deprecate(
      '`Store#liveQuery(type)` is deprecated, use `Store#findRecords(type).live()`.'
    );
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

  /**
   * @deprecated
   */
  findAll(type: string, options?: object): Promise<Model[]> {
    deprecate(
      '`Store#findAll(type)` is deprecated, use `Store#findRecords(type)`.'
    );
    return this.findRecords(type, options).then(result => result);
  }

  /**
   * @deprecated
   */
  find(type: string, id?: string | undefined): Promise<Model | Model[]> {
    if (id === undefined) {
      deprecate(
        '`Store#find(type)` is deprecated, use `Store#findRecords(type)`.'
      );
      return this.findRecords(type).then(result => result);
    } else {
      deprecate(
        '`Store#find(type, id)` is deprecated, use `Store#findRecord({ type, id })`.'
      );
      return this.findRecord(type, id).then(result => result);
    }
  }

  findRecord(
    identifier: RecordIdentity | string,
    id?: string | object,
    options?: object
  ): FindRecordQueryBuilder {
    if (typeof identifier === 'string' && typeof id === 'string') {
      deprecate(
        '`Store#findRecord(type, id)` is deprecated, use `Store#findRecord({ type, id })`.'
      );
      identifier = { type: identifier, id };
    } else {
      options = id as object;
    }
    if (typeof identifier !== 'object') {
      throw new TypeError('findRecord should be called with an identifier.');
    }

    const queryBuilder = new FindRecordQueryBuilder(this, identifier);

    if (options) {
      return queryBuilder.options(options);
    }
    return queryBuilder;
  }

  findRecords(
    type: string | RecordIdentity[],
    options?: object
  ): FindRecordsQueryBuilder {
    const queryBuilder = new FindRecordsQueryBuilder(this, type);

    if (options) {
      return queryBuilder.options(options);
    }
    return queryBuilder;
  }

  findRelatedRecord(
    identifier: RecordIdentity,
    relationship: string,
    options?: object
  ): FindRelatedRecordQueryBuilder {
    const queryBuilder = new FindRelatedRecordQueryBuilder(
      this,
      identifier,
      relationship
    );

    if (options) {
      return queryBuilder.options(options);
    }
    return queryBuilder;
  }

  findRelatedRecords(
    identifier: RecordIdentity,
    relationship: string,
    options?: object
  ): FindRelatedRecordsQueryBuilder {
    const queryBuilder = new FindRelatedRecordsQueryBuilder(
      this,
      identifier,
      relationship
    );

    if (options) {
      return queryBuilder.options(options);
    }
    return queryBuilder;
  }

  findRecordByKey(
    type: string,
    keyName: string,
    keyValue: string,
    options?: object
  ): Promise<Model> {
    return this.findRecord(
      {
        type,
        id: this.cache.recordIdFromKey(type, keyName, keyValue)
      },
      options
    ).then(result => result);
  }

  peekRecord(
    identifier: RecordIdentity | string,
    id?: string
  ): Model | undefined {
    if (typeof identifier === 'string' && id) {
      deprecate(
        '`Store#peekRecord(type, id)` is deprecated, use `Store#peekRecord({ type, id })`.'
      );
      identifier = { type: identifier, id };
    }
    return this.cache.peekRecord(identifier);
  }

  peekRecords(type: string): Model[] {
    return this.cache.peekRecords(type);
  }

  peekRecordByKey(
    type: string,
    keyName: string,
    keyValue: string
  ): Model | undefined {
    return this.cache.peekRecordByKey(type, keyName, keyValue);
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

  transformsSince(transformId: string): Transform[] {
    return this.source.transformsSince(transformId);
  }

  allTransforms(): Transform[] {
    return this.source.allTransforms();
  }

  getTransform(transformId: string): Transform {
    return this.source.getTransform(transformId);
  }

  getInverseOperations(transformId: string): RecordOperation[] {
    return this.source.getInverseOperations(transformId);
  }
}
