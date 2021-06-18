import { getOwner, setOwner } from '@ember/application';
import { associateDestroyableChild, destroy } from '@ember/destroyable';
import { Listener, Log, Orbit, TaskQueue } from '@orbit/core';
import {
  buildQuery,
  buildTransform,
  DefaultRequestOptions,
  FullRequestOptions,
  FullResponse,
  QueryOrExpressions,
  RequestOptions
} from '@orbit/data';
import MemorySource, { MemorySourceMergeOptions } from '@orbit/memory';
import { RecordCacheQueryOptions } from '@orbit/record-cache';
import {
  RecordIdentity,
  RecordKeyMap,
  RecordOperation,
  RecordQueryBuilder,
  RecordQueryExpression,
  RecordQueryResult,
  RecordSchema,
  RecordSourceQueryOptions,
  RecordTransform,
  RecordTransformResult,
  StandardRecordValidator
} from '@orbit/records';
import { StandardValidator, ValidatorForFn } from '@orbit/validators';
import Cache from './cache';
import Model from './model';
import ModelFactory from './model-factory';
import {
  ModelAwareQueryBuilder,
  ModelAwareQueryOrExpressions,
  ModelAwareTransformBuilder,
  ModelAwareTransformOrOperations
} from './utils/model-aware-types';
import { ModelFields } from './utils/model-fields';

const { deprecate } = Orbit;

export interface StoreSettings {
  source: MemorySource;
  mutableModelFields?: boolean;
  base?: Store;
}

/**
 * @class Store
 */
export default class Store {
  #source: MemorySource;
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

    this.#cache = new Cache({
      sourceCache: this.source.cache,
      modelFactory: new ModelFactory(
        this,
        this.forked || settings.mutableModelFields === true
      )
    });

    if (this.#base) {
      associateDestroyableChild(this.#base, this);
    }
    associateDestroyableChild(this, this.#cache);
  }

  destroy() {
    destroy(this);
  }

  get source(): MemorySource {
    return this.#source;
  }

  get cache(): Cache {
    return this.#cache;
  }

  get keyMap(): RecordKeyMap | undefined {
    return this.source.keyMap;
  }

  get schema(): RecordSchema {
    return this.source.schema;
  }

  get queryBuilder(): ModelAwareQueryBuilder {
    return this.source.queryBuilder;
  }

  get transformBuilder(): ModelAwareTransformBuilder {
    return this.source.transformBuilder;
  }

  get validatorFor():
    | ValidatorForFn<StandardValidator | StandardRecordValidator>
    | undefined {
    return this.#source.validatorFor;
  }

  get defaultQueryOptions():
    | DefaultRequestOptions<RecordSourceQueryOptions>
    | undefined {
    return this.source.defaultQueryOptions;
  }

  set defaultQueryOptions(
    options: DefaultRequestOptions<RecordSourceQueryOptions> | undefined
  ) {
    this.source.defaultQueryOptions = options;
  }

  get defaultTransformOptions():
    | DefaultRequestOptions<RequestOptions>
    | undefined {
    return this.source.defaultTransformOptions;
  }

  set defaultTransformOptions(
    options: DefaultRequestOptions<RequestOptions> | undefined
  ) {
    this.source.defaultTransformOptions = options;
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
      schema: this.schema,
      cacheSettings: { debounceLiveQueries: false }
    });
    const injections = getOwner(this).ownerInjection();

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
    queryOrExpressions: QueryOrExpressions<
      RecordQueryExpression,
      RecordQueryBuilder
    >,
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

  async query<
    RequestData extends RecordQueryResult<Model> = RecordQueryResult<Model>
  >(
    queryOrExpressions: ModelAwareQueryOrExpressions,
    options?: DefaultRequestOptions<RecordCacheQueryOptions>,
    id?: string
  ): Promise<RequestData>;
  async query<
    RequestData extends RecordQueryResult<Model> = RecordQueryResult<Model>
  >(
    queryOrExpressions: ModelAwareQueryOrExpressions,
    options: FullRequestOptions<RecordCacheQueryOptions>,
    id?: string
  ): Promise<FullResponse<RequestData, undefined, RecordOperation>>;
  async query<
    RequestData extends RecordQueryResult<Model> = RecordQueryResult<Model>
  >(
    queryOrExpressions: ModelAwareQueryOrExpressions,
    options?: RecordCacheQueryOptions,
    id?: string
  ): Promise<
    RequestData | FullResponse<RequestData, undefined, RecordOperation>
  > {
    const query = buildQuery(
      queryOrExpressions,
      options,
      id,
      this.source.queryBuilder
    );
    if (options?.fullResponse) {
      const response = await this.source.query(query, { fullResponse: true });
      return {
        ...response,
        data: this.cache.lookupQueryResult(query, response.data)
      } as FullResponse<RequestData, undefined, RecordOperation>;
    } else {
      const data = await this.source.query(query);
      return this.cache.lookupQueryResult(query, data) as RequestData;
    }
  }

  /**
   * Adds a record
   */
  async addRecord(
    properties: ModelFields,
    options?: DefaultRequestOptions<RequestOptions>
  ): Promise<Model> {
    if (options?.fullResponse) {
      delete options.fullResponse;
    }
    return await this.update((t) => t.addRecord(properties), options);
  }

  /**
   * Updates a record
   */
  async updateRecord(
    properties: ModelFields,
    options?: DefaultRequestOptions<RequestOptions>
  ): Promise<Model> {
    if (options?.fullResponse) {
      delete options.fullResponse;
    }
    return await this.update((t) => t.updateRecord(properties), options);
  }

  /**
   * Removes a record
   */
  async removeRecord(
    record: RecordIdentity,
    options?: DefaultRequestOptions<RequestOptions>
  ): Promise<void> {
    if (options?.fullResponse) {
      delete options.fullResponse;
    }
    await this.update((t) => t.removeRecord(record), options);
  }

  find(
    type: string,
    id?: string | undefined,
    options?: RequestOptions
  ): Promise<Model | Model[]> {
    if (id === undefined) {
      return this.findRecords(type, options);
    } else {
      return this.findRecord(type, id, options);
    }
  }

  async findRecord(
    type: string,
    id: string,
    options?: RequestOptions
  ): Promise<Model> {
    if (options?.fullResponse) {
      delete options.fullResponse;
    }
    return await this.query(
      (q) => q.findRecord({ type, id }),
      options as DefaultRequestOptions<RequestOptions>
    );
  }

  async findRecords(type: string, options?: RequestOptions): Promise<Model[]> {
    if (options?.fullResponse) {
      delete options.fullResponse;
    }
    return await this.query(
      (q) => q.findRecords(type),
      options as DefaultRequestOptions<RequestOptions>
    );
  }

  async findRecordByKey(
    type: string,
    keyName: string,
    keyValue: string,
    options?: RequestOptions
  ): Promise<Model> {
    if (options?.fullResponse) {
      delete options.fullResponse;
    }
    return await this.findRecord(
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

  async sync(
    transformOrTransforms: RecordTransform | RecordTransform[]
  ): Promise<void> {
    await this.source.sync(transformOrTransforms);
  }

  update<
    RequestData extends RecordTransformResult<Model> = RecordTransformResult<Model>
  >(
    transformOrOperations: ModelAwareTransformOrOperations,
    options?: DefaultRequestOptions<RequestOptions>,
    id?: string
  ): Promise<RequestData>;
  update<
    RequestData extends RecordTransformResult<Model> = RecordTransformResult<Model>
  >(
    transformOrOperations: ModelAwareTransformOrOperations,
    options: FullRequestOptions<RequestOptions>,
    id?: string
  ): Promise<FullResponse<RequestData, unknown, RecordOperation>>;
  async update<
    RequestData extends RecordTransformResult<Model> = RecordTransformResult<Model>
  >(
    transformOrOperations: ModelAwareTransformOrOperations,
    options?: RequestOptions,
    id?: string
  ): Promise<
    RequestData | FullResponse<RequestData, unknown, RecordOperation>
  > {
    const transform = buildTransform(
      transformOrOperations,
      options,
      id,
      this.source.transformBuilder
    );
    if (options?.fullResponse) {
      const response = await this.source.update(transform, {
        fullResponse: true
      });
      return {
        ...response,
        data: this.cache.lookupTransformResult(transform, response.data)
      } as FullResponse<RequestData, undefined, RecordOperation>;
    } else {
      const data = await this.source.update(transform);
      return this.cache.lookupTransformResult(transform, data) as RequestData;
    }
  }

  transformsSince(transformId: string): RecordTransform[] {
    return this.source.transformsSince(transformId);
  }

  allTransforms(): RecordTransform[] {
    return this.source.allTransforms();
  }

  getTransform(transformId: string): RecordTransform {
    return this.source.getTransform(transformId);
  }

  getInverseOperations(transformId: string): RecordOperation[] {
    return this.source.getInverseOperations(transformId);
  }
}
