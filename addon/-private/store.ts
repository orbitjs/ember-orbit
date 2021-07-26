import { getOwner, setOwner } from '@ember/application';
import { associateDestroyableChild, destroy } from '@ember/destroyable';
import { Assertion, Listener, Log, Orbit, TaskQueue } from '@orbit/core';
import {
  buildQuery,
  buildTransform,
  DefaultRequestOptions,
  FullRequestOptions,
  FullResponse,
  RequestOptions,
  TransformBuilderFunc
} from '@orbit/data';
import MemorySource, { MemorySourceMergeOptions } from '@orbit/memory';
import { RecordCacheQueryOptions } from '@orbit/record-cache';
import {
  InitializedRecord,
  RecordKeyMap,
  RecordOperation,
  RecordQueryResult,
  RecordSchema,
  RecordSourceQueryOptions,
  RecordTransform,
  RecordTransformResult,
  StandardRecordValidator,
  UninitializedRecord
} from '@orbit/records';
import { StandardValidator, ValidatorForFn } from '@orbit/validators';
import Cache, { CacheSettings } from './cache';
import LiveQuery from './live-query';
import Model from './model';
import {
  ModelAwareQueryBuilder,
  ModelAwareQueryOrExpressions,
  ModelAwareTransformBuilder,
  ModelAwareTransformOrOperations,
  RecordIdentityOrModel
} from './utils/model-aware-types';
import { ModelFields } from './utils/model-fields';

const { assert, deprecate } = Orbit;

export interface StoreSettings {
  source: MemorySource<
    RecordSourceQueryOptions,
    RequestOptions,
    ModelAwareQueryBuilder,
    ModelAwareTransformBuilder
  >;
  mutableModelFields?: boolean;
  base?: Store;
}

/**
 * @class Store
 */
export default class Store {
  #source: MemorySource<
    RecordSourceQueryOptions,
    RequestOptions,
    ModelAwareQueryBuilder,
    ModelAwareTransformBuilder
  >;
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

    const owner = getOwner(settings);
    const cacheSettings: CacheSettings = {
      sourceCache: this.source.cache
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

  get source(): MemorySource<
    RecordSourceQueryOptions,
    RequestOptions,
    ModelAwareQueryBuilder,
    ModelAwareTransformBuilder
  > {
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

  merge<
    RequestData extends RecordTransformResult<Model> = RecordTransformResult<Model>
  >(
    forkedStore: Store,
    options?: DefaultRequestOptions<RequestOptions> & MemorySourceMergeOptions
  ): Promise<RequestData>;
  merge<
    RequestData extends RecordTransformResult<Model> = RecordTransformResult<Model>
  >(
    forkedStore: Store,
    options: FullRequestOptions<RequestOptions> & MemorySourceMergeOptions
  ): Promise<FullResponse<RequestData, unknown, RecordOperation>>;
  async merge<
    RequestData extends RecordTransformResult<Model> = RecordTransformResult<Model>
  >(
    forkedStore: Store,
    options?: RequestOptions & MemorySourceMergeOptions
  ): Promise<
    RequestData | FullResponse<RequestData, unknown, RecordOperation>
  > {
    if (options?.fullResponse) {
      let response = (await this.source.merge(
        forkedStore.source,
        options as FullRequestOptions<RequestOptions> & MemorySourceMergeOptions
      )) as FullResponse<
        RecordTransformResult<InitializedRecord>,
        unknown,
        RecordOperation
      >;
      if (response.data !== undefined) {
        const data = this.cache._lookupTransformResult(
          response.data,
          true // merge results should ALWAYS be an array
        );
        response = {
          ...response,
          data
        };
      }
      return response as FullResponse<RequestData, unknown, RecordOperation>;
    } else {
      let response = (await this.source.merge(
        forkedStore.source,
        options as DefaultRequestOptions<RequestOptions> &
          MemorySourceMergeOptions
      )) as RecordTransformResult<InitializedRecord>;
      if (response !== undefined) {
        response = this.cache._lookupTransformResult(
          response,
          true // merge results should ALWAYS be an array
        );
      }
      return response as RequestData;
    }
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
  async liveQuery(
    queryOrExpressions: ModelAwareQueryOrExpressions,
    options?: DefaultRequestOptions<RecordCacheQueryOptions>,
    id?: string
  ): Promise<LiveQuery> {
    deprecate(
      'Store#liveQuery is deprecated. Call `let lq = store.cache.liveQuery(query)` instead. If you want to await the same query on the store, call `await store.query(lq.query);'
    );
    const query = buildQuery(
      queryOrExpressions,
      options,
      id,
      this.source.queryBuilder
    );
    await this.source.query(query);
    return this.cache.liveQuery(query);
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
        data: this.cache._lookupQueryResult(
          response.data,
          Array.isArray(query.expressions)
        )
      } as FullResponse<RequestData, undefined, RecordOperation>;
    } else {
      const response = await this.source.query(query);
      const data = this.cache._lookupQueryResult(
        response,
        Array.isArray(query.expressions)
      );
      return data as RequestData;
    }
  }

  /**
   * Adds a record
   */
  async addRecord<RequestData extends RecordTransformResult<Model> = Model>(
    properties: UninitializedRecord | ModelFields,
    options?: DefaultRequestOptions<RecordCacheQueryOptions>
  ): Promise<RequestData> {
    assert(
      'Store#addRecord does not support the `fullResponse` option. Call `store.update(..., { fullResponse: true })` instead.',
      options?.fullResponse === undefined
    );
    return await this.update((t) => t.addRecord(properties), options);
  }

  /**
   * Updates a record
   */
  async updateRecord<RequestData extends RecordTransformResult<Model> = Model>(
    properties: InitializedRecord | ModelFields,
    options?: DefaultRequestOptions<RecordCacheQueryOptions>
  ): Promise<RequestData> {
    assert(
      'Store#updateRecord does not support the `fullResponse` option. Call `store.update(..., { fullResponse: true })` instead.',
      options?.fullResponse === undefined
    );
    return await this.update((t) => t.updateRecord(properties), options);
  }

  /**
   * Removes a record
   */
  async removeRecord(
    identity: RecordIdentityOrModel,
    options?: DefaultRequestOptions<RecordCacheQueryOptions>
  ): Promise<void> {
    assert(
      'Store#removeRecord does not support the `fullResponse` option. Call `store.update(..., { fullResponse: true })` instead.',
      options?.fullResponse === undefined
    );
    await this.update((t) => t.removeRecord(identity), options);
  }

  /**
   * @deprecated
   */
  find(
    type: string,
    id?: string | undefined,
    options?: DefaultRequestOptions<RecordCacheQueryOptions>
  ): Promise<Model | Model[] | undefined> {
    deprecate(
      'Store#find is deprecated. Call `store.findRecords(type)`, `store.findRecord(type, id)`, or `store.query(...)` instead.'
    );
    if (id === undefined) {
      return this.findRecords(type, options);
    } else {
      return this.findRecord(type, id, options);
    }
  }

  findRecord<RequestData extends RecordQueryResult<Model> = Model | undefined>(
    type: string,
    id: string,
    options?: DefaultRequestOptions<RecordCacheQueryOptions>
  ): Promise<Model | undefined>;
  findRecord<RequestData extends RecordQueryResult<Model> = Model | undefined>(
    identity: RecordIdentityOrModel,
    options?: DefaultRequestOptions<RecordCacheQueryOptions>
  ): Promise<Model | undefined>;
  async findRecord<
    RequestData extends RecordQueryResult<Model> = Model | undefined
  >(
    typeOrIdentity: string | RecordIdentityOrModel,
    idOrOptions?: string | DefaultRequestOptions<RecordCacheQueryOptions>,
    options?: DefaultRequestOptions<RecordCacheQueryOptions>
  ): Promise<RequestData> {
    if (options?.fullResponse) {
      delete options.fullResponse;
    }
    let identity: RecordIdentityOrModel;
    let queryOptions: DefaultRequestOptions<RequestOptions> | undefined;
    if (typeof typeOrIdentity === 'string') {
      if (typeof idOrOptions === 'string') {
        identity = { type: typeOrIdentity, id: idOrOptions };
        queryOptions = options;
      } else {
        throw new Assertion(
          'Store#findRecord may be called with either `type` and `id` strings OR a single `identity` object.'
        );
      }
    } else {
      identity = typeOrIdentity;
      queryOptions = idOrOptions as DefaultRequestOptions<RequestOptions>;
    }
    return await this.query((q) => q.findRecord(identity), queryOptions);
  }

  async findRecords<RequestData extends RecordQueryResult<Model> = Model[]>(
    typeOrIdentities: string | RecordIdentityOrModel[],
    options?: DefaultRequestOptions<RecordCacheQueryOptions>
  ): Promise<RequestData> {
    if (options?.fullResponse) {
      delete options.fullResponse;
    }
    return await this.query<RequestData>(
      (q) => q.findRecords(typeOrIdentities),
      options
    );
  }

  /**
   * @deprecated
   */
  async findRecordByKey(
    type: string,
    key: string,
    value: string,
    options?: DefaultRequestOptions<RecordCacheQueryOptions>
  ): Promise<Model | undefined> {
    deprecate(
      'Store#findRecordByKey is deprecated. Instead of `store.findRecordByKey(type, key, value)`, call `store.findRecord({ type, key, value })` or `store.query(...)`.'
    );
    return this.findRecord({ type, key, value }, options);
  }

  /**
   * @deprecated
   */
  peekRecord(type: string, id: string): Model | undefined {
    deprecate(
      'Store#peekRecord is deprecated. Instead of `store.peekRecord(type, id)`, call `store.cache.findRecord(type, id)` or `store.cache.query(...)`.'
    );
    return this.cache.findRecord(type, id);
  }

  /**
   * @deprecated
   */
  peekRecords(type: string): Model[] {
    deprecate(
      'Store#peekRecords is deprecated. Instead of `store.peekRecords(type)`, call `store.cache.findRecords(type)` or `store.cache.query(...)`.'
    );
    return this.cache.findRecords(type);
  }

  /**
   * @deprecated
   */
  peekRecordByKey(type: string, key: string, value: string): Model | undefined {
    deprecate(
      'Store#peekRecordByKey is deprecated. Instead of `store.peekRecordByKey(type, key, value)`, call `store.cache.findRecord({ type, key, value })` or `store.cache.query(...)`.'
    );
    return this.cache.findRecord({ type, key, value });
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
    transformOrTransforms:
      | RecordTransform
      | RecordTransform[]
      | TransformBuilderFunc<RecordOperation, ModelAwareTransformBuilder>
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
      let response = await this.source.update(transform, {
        fullResponse: true
      });
      if (response.data !== undefined) {
        const data = this.cache._lookupTransformResult(
          response.data,
          Array.isArray(transform.operations)
        );
        response = {
          ...response,
          data
        };
      }
      return response as FullResponse<RequestData, unknown, RecordOperation>;
    } else {
      let response = await this.source.update(transform);
      if (response !== undefined) {
        response = this.cache._lookupTransformResult(
          response,
          Array.isArray(transform.operations)
        );
      }
      return response as RequestData;
    }
  }

  transformsSince(transformId: string): RecordTransform[] {
    deprecate(
      '`Store#transformsSince` is deprecated. Call `getTransformsSince` instead.'
    );
    return this.getTransformsSince(transformId);
  }

  getTransformsSince(transformId: string): RecordTransform[] {
    return this.source.getTransformsSince(transformId);
  }

  allTransforms(): RecordTransform[] {
    deprecate(
      '`Store#allTransforms` is deprecated. Call `getAllTransforms` instead.'
    );
    return this.getAllTransforms();
  }

  getAllTransforms(): RecordTransform[] {
    return this.source.getAllTransforms();
  }

  getTransform(transformId: string): RecordTransform {
    return this.source.getTransform(transformId);
  }

  getInverseOperations(transformId: string): RecordOperation[] {
    return this.source.getInverseOperations(transformId);
  }
}
