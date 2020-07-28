import { getOwner, setOwner } from '@ember/application';

import {
  buildQuery,
  QueryOrExpressions,
  RecordIdentity,
  Transform,
  TransformOrOperations,
  cloneRecordIdentity,
  RecordOperation,
  KeyMap,
  Schema,
  TransformBuilder,
  RequestOptions
} from '@orbit/data';
import MemorySource, { MemorySourceMergeOptions } from '@orbit/memory';
import Orbit, { Log, TaskQueue, Listener } from '@orbit/core';
import { destroy, associateDestroyableChild } from 'ember-destroyable-polyfill';

import Cache from './cache';
import Model, { QueryResult } from './model';
import normalizeRecordProperties from './utils/normalize-record-properties';
import IdentityMap from './identity-map';

const { deprecate } = Orbit;

export interface StoreSettings {
  source: MemorySource;
  mutableModels?: boolean;
  base?: Store;
  createModelsFromSchema?: boolean;
}

/**
 * @class Store
 */
export default class Store {
  #source: MemorySource;
  #identityMap: IdentityMap;
  #cache: Cache;
  #base?: Store;

  static create(injections: StoreSettings): Store {
    const owner = getOwner(injections);
    const store = new this(injections);
    setOwner(store, owner);
    return store;
  }

  constructor(settings: StoreSettings) {
    this.#source = settings.source;
    this.#base = settings.base;

    this.#identityMap = new IdentityMap(this);
    this.#cache = new Cache({
      cache: this.#source.cache,
      identityMap: this.#identityMap
    });

    if (this.#base) {
      associateDestroyableChild(this.#base, this);
    }
    associateDestroyableChild(this, this.#identityMap);
  }

  destroy() {
    destroy(this);
  }

  get identityMap(): IdentityMap {
    return this.#identityMap;
  }

  get source(): MemorySource {
    return this.#source;
  }

  get cache(): Cache {
    return this.#cache;
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

  get forked(): boolean {
    return !!this.source.base;
  }

  get base(): Store | undefined {
    return this.#base;
  }

  fork(): Store {
    const forkedSource = this.source.fork({
      cacheSettings: { debounceLiveQueries: false } as any
    });
    const injections = getOwner(this).ownerInjection() as StoreSettings;

    return Store.create({
      ...injections,
      source: forkedSource,
      base: this
    });
  }

  merge(forkedStore: Store, options?: MemorySourceMergeOptions): Promise<any> {
    return this.source.merge(forkedStore.source, options);
  }

  rollback(transformId: string, relativePosition?: number): Promise<void> {
    return this.source.rollback(transformId, relativePosition);
  }

  rebase(): void {
    this.source.rebase();
  }

  liveQuery(
    queryOrExpressions: QueryOrExpressions,
    options?: RequestOptions,
    id?: string
  ): Promise<any> {
    deprecate(
      '`Store.liveQuery(query)` is deprecated, use `Store.cache.liveQuery(query)`.'
    );
    const query = buildQuery(
      queryOrExpressions,
      options,
      id,
      this.source.queryBuilder
    );
    return this.source.query(query).then(() => this.cache.liveQuery(query));
  }

  async query(
    queryOrExpressions: QueryOrExpressions,
    options?: RequestOptions,
    id?: string
  ): Promise<QueryResult> {
    const query = buildQuery(
      queryOrExpressions,
      options,
      id,
      this.source.queryBuilder
    );
    const result = await this.source.query(query);
    return this.identityMap.lookup(result, query.expressions.length);
  }

  /**
   * Adds a record to the Orbit store
   * @method addRecord
   * @param {object} properties
   * @param {object} options
   */
  async addRecord(properties = {}, options?: RequestOptions): Promise<Model> {
    let record = normalizeRecordProperties(this.source.schema, properties);
    await this.update((t) => t.addRecord(record), options);
    return this.identityMap.lookup(record) as Model;
  }

  async updateRecord(
    properties = {},
    options?: RequestOptions
  ): Promise<Model> {
    let record = normalizeRecordProperties(this.source.schema, properties);
    await this.update((t) => t.updateRecord(record), options);
    return this.identityMap.lookup(record) as Model;
  }

  /**
   * Removes a record from the Orbit store
   * @method removeRecord
   * @param {RecordIdentity} record
   * @param {object} options
   */
  async removeRecord(
    record: RecordIdentity,
    options?: RequestOptions
  ): Promise<void> {
    const identity = cloneRecordIdentity(record);
    await this.update((t) => t.removeRecord(identity), options);
  }

  /**
   * @method find
   * @param {string} type
   * @param {string} id
   */
  find(type: string, id?: string | undefined): Promise<Model | Model[]> {
    if (id === undefined) {
      return this.findRecords(type);
    } else {
      return this.findRecord(type, id);
    }
  }

  findRecord(
    type: string,
    id: string,
    options?: RequestOptions
  ): Promise<Model> {
    return this.query((q) => q.findRecord({ type, id }), options) as Promise<
      Model
    >;
  }

  findRecords(type: string, options?: RequestOptions): Promise<Model[]> {
    return this.query((q) => q.findRecords(type), options) as Promise<Model[]>;
  }

  findRecordByKey(
    type: string,
    keyName: string,
    keyValue: string,
    options?: RequestOptions
  ): Promise<Model> {
    return this.findRecord(
      type,
      this.cache.recordIdFromKey(type, keyName, keyValue),
      options
    );
  }

  peekRecord(type: string, id: string): Model | undefined {
    return this.cache.peekRecord(type, id);
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
    options?: RequestOptions,
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
