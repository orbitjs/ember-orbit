import { getOwner, setOwner } from '@ember/application';
import { registerDestructor } from '@ember/destroyable';
import { Assertion, Orbit } from '@orbit/core';
import {
  buildQuery,
  buildTransform,
  type DefaultRequestOptions,
  type FullRequestOptions,
  type FullResponse,
  type RequestOptions,
} from '@orbit/data';
import IdentityMap from '@orbit/identity-map';
import {
  MemoryCache,
  type MemoryCacheMergeOptions,
  type MemoryCacheSettings,
} from '@orbit/memory';
import type {
  RecordCacheQueryOptions,
  RecordCacheTransformOptions,
} from '@orbit/record-cache';
import {
  type InitializedRecord,
  type RecordIdentity,
  RecordKeyMap,
  type RecordOperation,
  type RecordOperationResult,
  type RecordQueryExpressionResult,
  type RecordQueryResult,
  RecordSchema,
  type RecordTransformResult,
  type StandardRecordValidator,
  type UninitializedRecord,
} from '@orbit/records';
import type { StandardValidator, ValidatorForFn } from '@orbit/validators';
import type Store from './store';
import LiveQuery from './live-query';
import Model from './model';
import ModelFactory from './model-factory';
import {
  ModelAwareQueryBuilder,
  type ModelAwareQueryOrExpressions,
  ModelAwareTransformBuilder,
  type ModelAwareTransformOrOperations,
  type RecordIdentityOrModel,
} from './utils/model-aware-types';
import type { ModelFields } from './utils/model-fields';
import recordIdentitySerializer from './utils/record-identity-serializer';
import type ApplicationInstance from '@ember/application/instance';

const { assert, deprecate } = Orbit;

export interface CacheSettings {
  sourceCache: MemoryCache;
  store?: Store;
  base?: Cache;
}

export default class Cache {
  #sourceCache: MemoryCache<
    RecordCacheQueryOptions,
    RecordCacheTransformOptions,
    ModelAwareQueryBuilder,
    ModelAwareTransformBuilder
  >;
  #store?: Store;
  #base?: Cache;
  #modelFactory: ModelFactory;
  allowUpdates: boolean;

  protected _identityMap: IdentityMap<RecordIdentity, Model> = new IdentityMap({
    serializer: recordIdentitySerializer,
  });

  constructor(settings: CacheSettings) {
    const owner = getOwner(settings) as ApplicationInstance;
    setOwner(this, owner);

    this.#sourceCache = settings.sourceCache;
    this.#store = settings.store;
    this.#base = settings.base;
    this.#modelFactory = new ModelFactory(this);
    this.allowUpdates = this.#sourceCache.base !== undefined;

    const patchUnbind = this.#sourceCache.on(
      'patch',
      this.generatePatchListener(),
    );

    registerDestructor(this, () => {
      patchUnbind();
      this._identityMap.clear();
    });
  }

  get sourceCache(): MemoryCache {
    return this.#sourceCache;
  }

  get store(): Store | undefined {
    return this.#store;
  }

  get keyMap(): RecordKeyMap | undefined {
    return this.#sourceCache.keyMap;
  }

  get schema(): RecordSchema {
    return this.#sourceCache.schema;
  }

  get queryBuilder(): ModelAwareQueryBuilder {
    return this.#sourceCache.queryBuilder;
  }

  get transformBuilder(): ModelAwareTransformBuilder {
    return this.#sourceCache.transformBuilder;
  }

  get validatorFor():
    | ValidatorForFn<StandardValidator | StandardRecordValidator>
    | undefined {
    return this.#sourceCache.validatorFor;
  }

  get defaultQueryOptions():
    | DefaultRequestOptions<RecordCacheQueryOptions>
    | undefined {
    return this.#sourceCache.defaultQueryOptions;
  }

  set defaultQueryOptions(
    options: DefaultRequestOptions<RecordCacheQueryOptions> | undefined,
  ) {
    this.#sourceCache.defaultQueryOptions = options;
  }

  get defaultTransformOptions():
    | DefaultRequestOptions<RecordCacheTransformOptions>
    | undefined {
    return this.#sourceCache.defaultTransformOptions;
  }

  set defaultTransformOptions(
    options: DefaultRequestOptions<RecordCacheTransformOptions> | undefined,
  ) {
    this.#sourceCache.defaultTransformOptions = options;
  }

  get isForked(): boolean {
    return this.#sourceCache.base !== undefined;
  }

  get base(): Cache | undefined {
    return this.#base;
  }

  fork(
    settings: Partial<
      MemoryCacheSettings<
        RecordCacheQueryOptions,
        RecordCacheTransformOptions,
        ModelAwareQueryBuilder,
        ModelAwareTransformBuilder
      >
    > = {},
  ): Cache {
    const forkedCache = this.#sourceCache.fork(settings);
    const injections = (getOwner(this) as ApplicationInstance).ownerInjection();

    return new Cache({
      ...injections,
      sourceCache: forkedCache,
      base: this,
    });
  }

  merge<
    RequestData extends
      RecordTransformResult<Model> = RecordTransformResult<Model>,
  >(
    forkedCache: Cache,
    options?: DefaultRequestOptions<RequestOptions> & MemoryCacheMergeOptions,
  ): RequestData;
  merge<
    RequestData extends
      RecordTransformResult<Model> = RecordTransformResult<Model>,
  >(
    forkedCache: Cache,
    options: FullRequestOptions<RequestOptions> & MemoryCacheMergeOptions,
  ): FullResponse<RequestData, unknown, RecordOperation>;
  merge<
    RequestData extends
      RecordTransformResult<Model> = RecordTransformResult<Model>,
  >(
    forkedCache: Cache,
    options?: RequestOptions & MemoryCacheMergeOptions,
  ): RequestData | FullResponse<RequestData, unknown, RecordOperation> {
    if (options?.fullResponse) {
      let response = this.#sourceCache.merge(
        forkedCache.sourceCache,
        options as FullRequestOptions<RequestOptions> & MemoryCacheMergeOptions,
      ) as FullResponse<
        RecordTransformResult<InitializedRecord>,
        unknown,
        RecordOperation
      >;
      if (response.data !== undefined) {
        const data = this._lookupTransformResult(
          response.data,
          true, // merge results should ALWAYS be an array
        );
        response = {
          ...response,
          data,
        };
      }
      return response as FullResponse<RequestData, unknown, RecordOperation>;
    } else {
      let response = this.#sourceCache.merge(
        forkedCache.sourceCache,
        options as DefaultRequestOptions<RequestOptions> &
          MemoryCacheMergeOptions,
      );
      if (response !== undefined) {
        response = this._lookupTransformResult(
          response,
          true, // merge results should ALWAYS be an array
        );
      }
      return response as RequestData;
    }
  }

  rebase(): void {
    this.#sourceCache.rebase();
  }

  reset(): void {
    this.#sourceCache.reset();
  }

  getRecordData(type: string, id: string): InitializedRecord | undefined {
    return this.#sourceCache.getRecordSync({ type, id });
  }

  includesRecord(type: string, id: string): boolean {
    return this.getRecordData(type, id) !== undefined;
  }

  recordIdFromKey(type: string, keyName: string, keyValue: string): string {
    const keyMap = this.keyMap as RecordKeyMap;
    assert(
      'No `keyMap` has been assigned to the Cache, so `recordIdFromKey` can not work.',
      keyMap !== undefined,
    );
    let id = keyMap.keyToId(type, keyName, keyValue);
    if (!id) {
      id = this.schema.generateId(type);
      keyMap.pushRecord({ type, id, keys: { [keyName]: keyValue } });
    }
    return id;
  }

  /**
   * @deprecated
   */
  peekRecordData(type: string, id: string): InitializedRecord | undefined {
    deprecate(
      'Cache#peekRecordData is deprecated. Call `getRecordData` instead.',
    );
    return this.#sourceCache.getRecordSync({ type, id });
  }

  /**
   * @deprecated
   */
  peekRecord(type: string, id: string): Model | undefined {
    deprecate('Cache#peekRecord is deprecated. Call `findRecord` instead.');
    return this.findRecord(type, id);
  }

  /**
   * @deprecated
   */
  peekRecords(type: string): Model[] {
    deprecate('Cache#peekRecords is deprecated. Call `findRecords` instead.');
    return this.findRecords(type);
  }

  /**
   * @deprecated
   */
  peekRecordByKey(type: string, key: string, value: string): Model | undefined {
    deprecate(
      'Cache#peekRecordByKey is deprecated. Instead of `cache.peekRecordByKey(type, key, value)`, call `cache.findRecord({ type, key, value })` or `cache.query(...)`.',
    );
    return this.findRecord({ type, key, value });
  }

  /**
   * @deprecated
   */
  peekKey(identity: RecordIdentity, key: string): string | undefined {
    deprecate(
      "Cache#peekKey is deprecated. Instead of `cache.peekKey({ type, id }, value)`, call `cache.findRecord({ type, id })` and then access the record's fields directly.",
    );
    const record = this.#sourceCache.getRecordSync(identity);
    return record?.keys?.[key];
  }

  /**
   * @deprecated
   */
  peekAttribute(identity: RecordIdentity, attribute: string): any {
    deprecate(
      "Cache#peekAttribute is deprecated. Instead of `cache.peekAttribute({ type, id }, attribute)`, call `cache.findRecord({ type, id })` and then access the record's fields directly.",
    );
    const record = this.#sourceCache.getRecordSync(identity);
    return record?.attributes?.[attribute];
  }

  /**
   * @deprecated
   */
  peekRelatedRecord(
    identity: RecordIdentity,
    relationship: string,
  ): Model | null | undefined {
    deprecate(
      "Cache#peekRelatedRecord is deprecated. Instead of `cache.peekRelatedRecord({ type, id }, relationship)`, call `cache.findRecord({ type, id })` and then access the record's fields directly.",
    );
    const relatedRecord = this.#sourceCache.getRelatedRecordSync(
      identity,
      relationship,
    );
    if (relatedRecord) {
      return this.lookup(relatedRecord);
    } else {
      return relatedRecord;
    }
  }

  /**
   * @deprecated
   */
  peekRelatedRecords(
    identity: RecordIdentity,
    relationship: string,
  ): Model[] | undefined {
    deprecate(
      "Cache#peekRelatedRecords is deprecated. Instead of `cache.peekRelatedRecords({ type, id }, relationship)`, call `cache.findRecord({ type, id })` and then access the record's fields directly.",
    );
    const relatedRecords = this.#sourceCache.getRelatedRecordsSync(
      identity,
      relationship,
    );
    if (relatedRecords) {
      return relatedRecords.map((r) => this.lookup(r));
    } else {
      return undefined;
    }
  }

  update<
    RequestData extends
      RecordTransformResult<Model> = RecordTransformResult<Model>,
  >(
    transformOrOperations: ModelAwareTransformOrOperations,
    options?: DefaultRequestOptions<RequestOptions>,
    id?: string,
  ): RequestData;
  update<
    RequestData extends
      RecordTransformResult<Model> = RecordTransformResult<Model>,
  >(
    transformOrOperations: ModelAwareTransformOrOperations,
    options: FullRequestOptions<RequestOptions>,
    id?: string,
  ): FullResponse<RequestData, unknown, RecordOperation>;
  update<
    RequestData extends
      RecordTransformResult<Model> = RecordTransformResult<Model>,
  >(
    transformOrOperations: ModelAwareTransformOrOperations,
    options?: RequestOptions,
    id?: string,
  ): RequestData | FullResponse<RequestData, unknown, RecordOperation> {
    assert(
      `You tried to update a cache that is not a fork, which is not allowed by default. Either fork the store/cache before making updates directly to the cache or, if the update you are making is ephemeral, set 'cache.allowUpdates = true' to override this assertion.`,
      this.allowUpdates,
    );

    const transform = buildTransform(
      transformOrOperations,
      options,
      id,
      this.#sourceCache.transformBuilder,
    );

    if (options?.fullResponse) {
      let response = this.#sourceCache.update(transform, {
        fullResponse: true,
      });
      if (response.data !== undefined) {
        const data = this._lookupTransformResult(
          response.data,
          Array.isArray(transform.operations),
        );
        response = {
          ...response,
          data,
        };
      }
      return response as FullResponse<RequestData, unknown, RecordOperation>;
    } else {
      let response = this.#sourceCache.update(transform);
      if (response !== undefined) {
        response = this._lookupTransformResult(
          response,
          Array.isArray(transform.operations),
        );
      }
      return response as RequestData;
    }
  }

  query<
    RequestData extends RecordQueryResult<Model> = RecordQueryResult<Model>,
  >(
    queryOrExpressions: ModelAwareQueryOrExpressions,
    options?: DefaultRequestOptions<RecordCacheQueryOptions>,
    id?: string,
  ): RequestData;
  query<
    RequestData extends RecordQueryResult<Model> = RecordQueryResult<Model>,
  >(
    queryOrExpressions: ModelAwareQueryOrExpressions,
    options: FullRequestOptions<RecordCacheQueryOptions>,
    id?: string,
  ): FullResponse<RequestData, undefined, RecordOperation>;
  query<
    RequestData extends RecordQueryResult<Model> = RecordQueryResult<Model>,
  >(
    queryOrExpressions: ModelAwareQueryOrExpressions,
    options?: RecordCacheQueryOptions,
    id?: string,
  ): RequestData | FullResponse<RequestData, undefined, RecordOperation> {
    const query = buildQuery(
      queryOrExpressions,
      options,
      id,
      this.#sourceCache.queryBuilder,
    );

    if (options?.fullResponse) {
      const response = this.#sourceCache.query(query, { fullResponse: true });
      const data = this._lookupQueryResult(
        response.data,
        Array.isArray(query.expressions),
      );
      return {
        ...response,
        data,
      } as FullResponse<RequestData, undefined, RecordOperation>;
    } else {
      const response = this.#sourceCache.query(query);
      const data = this._lookupQueryResult(
        response,
        Array.isArray(query.expressions),
      );
      return data as RequestData;
    }
  }

  liveQuery(
    queryOrExpressions: ModelAwareQueryOrExpressions,
    options?: DefaultRequestOptions<RecordCacheQueryOptions>,
    id?: string,
  ): LiveQuery {
    const query = buildQuery(
      queryOrExpressions,
      options,
      id,
      this.#sourceCache.queryBuilder,
    );
    const liveQuery = this.#sourceCache.liveQuery(query);
    return new LiveQuery({ liveQuery, cache: this, query });
  }

  /**
   * @deprecated
   */
  find(type: string, id?: string): Model | Model[] | undefined {
    deprecate(
      '`Cache#find` is deprecated. Call `cache.findRecords(type)`, `cache.findRecord(type, id)`, or `cache.query(...)` instead.',
    );
    if (id === undefined) {
      return this.findRecords(type);
    } else {
      return this.findRecord(type, id);
    }
  }

  findRecord(
    type: string,
    id: string,
    options?: DefaultRequestOptions<RecordCacheQueryOptions>,
  ): Model | undefined;
  findRecord(
    identity: RecordIdentityOrModel,
    options?: DefaultRequestOptions<RecordCacheQueryOptions>,
  ): Model | undefined;
  findRecord(
    typeOrIdentity: string | RecordIdentityOrModel,
    idOrOptions?: string | DefaultRequestOptions<RecordCacheQueryOptions>,
    options?: DefaultRequestOptions<RecordCacheQueryOptions>,
  ): Model | undefined {
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
          '`Cache#findRecord` may be called with either `type` and `id` strings OR a single `identity` object.',
        );
      }
    } else {
      identity = typeOrIdentity;
      queryOptions = idOrOptions as DefaultRequestOptions<RequestOptions>;
    }
    return this.query((q) => q.findRecord(identity), queryOptions);
  }

  findRecords(
    typeOrIdentities: string | RecordIdentityOrModel[],
    options?: DefaultRequestOptions<RecordCacheQueryOptions>,
  ): Model[] {
    if (options?.fullResponse) {
      delete options.fullResponse;
    }
    return this.query((q) => q.findRecords(typeOrIdentities), options);
  }

  /**
   * Adds a record
   */
  addRecord<RequestData extends RecordTransformResult<Model> = Model>(
    properties: UninitializedRecord | ModelFields,
    options?: DefaultRequestOptions<RecordCacheQueryOptions>,
  ): RequestData {
    assert(
      'Cache#addRecord does not support the `fullResponse` option. Call `cache.update(..., { fullResponse: true })` instead.',
      options?.fullResponse === undefined,
    );
    return this.update((t) => t.addRecord(properties), options);
  }

  /**
   * Updates a record
   */
  updateRecord<RequestData extends RecordTransformResult<Model> = Model>(
    properties: InitializedRecord | ModelFields,
    options?: DefaultRequestOptions<RecordCacheQueryOptions>,
  ): RequestData {
    assert(
      'Cache#updateRecord does not support the `fullResponse` option. Call `cache.update(..., { fullResponse: true })` instead.',
      options?.fullResponse === undefined,
    );
    return this.update((t) => t.updateRecord(properties), options);
  }

  /**
   * Removes a record
   */
  removeRecord(
    identity: RecordIdentityOrModel,
    options?: DefaultRequestOptions<RecordCacheQueryOptions>,
  ): void {
    assert(
      'Cache#removeRecord does not support the `fullResponse` option. Call `cache.update(..., { fullResponse: true })` instead.',
      options?.fullResponse === undefined,
    );
    this.update((t) => t.removeRecord(identity), options);
  }

  unload(identity: RecordIdentity): void {
    const record = this._identityMap.get(identity);
    if (record) {
      record.$disconnect();
      this._identityMap.delete(identity);
    }
  }

  lookup(identity: RecordIdentity): Model {
    let record = this._identityMap.get(identity);

    if (!record) {
      record = this.#modelFactory.create(identity);
      this._identityMap.set(identity, record);
    }

    return record;
  }

  _lookupQueryResult(
    result: RecordQueryResult<InitializedRecord>,
    isArray: boolean,
  ): RecordQueryResult<Model> {
    if (isArray) {
      if (Array.isArray(result)) {
        return (result as RecordQueryExpressionResult[]).map((i) =>
          this.lookupQueryExpressionResult(i),
        );
      } else {
        throw new Assertion(
          'A resultset for a query with an array of `expressions` should also be an array.',
        );
      }
    } else {
      return this.lookupQueryExpressionResult(
        result as RecordQueryExpressionResult<InitializedRecord>,
      );
    }
  }

  _lookupTransformResult(
    result: RecordTransformResult<InitializedRecord>,
    isArray: boolean,
  ): RecordTransformResult<Model> {
    if (isArray) {
      if (Array.isArray(result)) {
        return (result as RecordOperationResult[]).map((i) =>
          this.lookupOperationResult(i),
        );
      } else {
        throw new Assertion(
          'A resultset for a transform with an array of `operations` should also be an array.',
        );
      }
    } else {
      if (Array.isArray(result)) {
        throw new Assertion(
          'A resultset for a transform with singular (i.e. non-array) `operations` should not be an array.',
        );
      } else {
        return this.lookupOperationResult(result);
      }
    }
  }

  private lookupQueryExpressionResult(
    result: RecordQueryExpressionResult<InitializedRecord>,
  ): RecordQueryExpressionResult<Model> {
    if (Array.isArray(result)) {
      return result.map((i) => (i ? this.lookup(i) : i));
    } else if (result) {
      return this.lookup(result);
    } else {
      return result;
    }
  }

  private lookupOperationResult(
    result: RecordOperationResult<InitializedRecord>,
  ): RecordOperationResult<Model> {
    if (result) {
      return this.lookup(result);
    } else {
      return result;
    }
  }

  private notifyPropertyChange(
    identity: RecordIdentity,
    property: string,
  ): void {
    const record = this._identityMap.get(identity);
    record?.$notifyPropertyChange(property);
  }

  private generatePatchListener(): (operation: RecordOperation) => void {
    return (operation: RecordOperation) => {
      const record = operation.record as InitializedRecord;
      const { type, id, keys, attributes, relationships } = record;
      const identity = { type, id };

      switch (operation.op) {
        case 'updateRecord':
          for (const properties of [attributes, keys, relationships]) {
            if (properties) {
              for (const property of Object.keys(properties)) {
                if (
                  Object.prototype.hasOwnProperty.call(properties, property)
                ) {
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
