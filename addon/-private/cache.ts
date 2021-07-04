import { registerDestructor } from '@ember/destroyable';
import { Assertion, Orbit } from '@orbit/core';
import {
  buildQuery,
  DefaultRequestOptions,
  FullRequestOptions,
  FullResponse,
  RequestOptions
} from '@orbit/data';
import IdentityMap from '@orbit/identity-map';
import { MemoryCache } from '@orbit/memory';
import {
  RecordCacheQueryOptions,
  RecordCacheTransformOptions
} from '@orbit/record-cache';
import {
  InitializedRecord,
  RecordIdentity,
  RecordKeyMap,
  RecordOperation,
  RecordOperationResult,
  RecordQueryExpressionResult,
  RecordQueryResult,
  RecordSchema,
  RecordTransformResult,
  StandardRecordValidator
} from '@orbit/records';
import { StandardValidator, ValidatorForFn } from '@orbit/validators';
import LiveQuery from './live-query';
import Model from './model';
import ModelFactory from './model-factory';
import {
  ModelAwareQueryBuilder,
  ModelAwareQueryOrExpressions,
  ModelAwareTransformBuilder,
  RecordIdentityOrModel
} from './utils/model-aware-types';
import recordIdentitySerializer from './utils/record-identity-serializer';

const { assert, deprecate } = Orbit;

export interface CacheSettings {
  sourceCache: MemoryCache;
  modelFactory: ModelFactory;
}

export default class Cache {
  #sourceCache: MemoryCache<
    RecordCacheQueryOptions,
    RecordCacheTransformOptions,
    ModelAwareQueryBuilder,
    ModelAwareTransformBuilder
  >;
  #modelFactory: ModelFactory;
  protected _identityMap: IdentityMap<RecordIdentity, Model> = new IdentityMap({
    serializer: recordIdentitySerializer
  });

  constructor(settings: CacheSettings) {
    this.#sourceCache = settings.sourceCache;
    this.#modelFactory = settings.modelFactory;

    const patchUnbind = this.#sourceCache.on(
      'patch',
      this.generatePatchListener()
    );

    registerDestructor(this, () => {
      patchUnbind();
      this._identityMap.clear();
    });
  }

  get sourceCache(): MemoryCache {
    return this.#sourceCache;
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
    options: DefaultRequestOptions<RecordCacheQueryOptions> | undefined
  ) {
    this.#sourceCache.defaultQueryOptions = options;
  }

  get defaultTransformOptions():
    | DefaultRequestOptions<RecordCacheTransformOptions>
    | undefined {
    return this.#sourceCache.defaultTransformOptions;
  }

  set defaultTransformOptions(
    options: DefaultRequestOptions<RecordCacheTransformOptions> | undefined
  ) {
    this.#sourceCache.defaultTransformOptions = options;
  }

  getRecordData(type: string, id: string): InitializedRecord | undefined {
    return this.#sourceCache.getRecordSync({ type, id });
  }

  includesRecord(type: string, id: string): boolean {
    return !!this.getRecordData(type, id);
  }

  recordIdFromKey(type: string, keyName: string, keyValue: string): string {
    let keyMap = this.keyMap as RecordKeyMap;
    assert(
      'No `keyMap` has been assigned to the Cache, so `recordIdFromKey` can not work.',
      !!keyMap
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
      'Cache#peekRecordData is deprecated. Call `getRecordData` instead.'
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
      'Cache#peekRecordByKey is deprecated. Instead of `cache.peekRecordByKey(type, key, value)`, call `cache.findRecord({ type, key, value })` or `cache.query(...)`.'
    );
    return this.findRecord({ type, key, value });
  }

  /**
   * @deprecated
   */
  peekKey(identity: RecordIdentity, key: string): string | undefined {
    deprecate(
      "Cache#peekKey is deprecated. Instead of `cache.peekKey({ type, id }, value)`, call `cache.findRecord({ type, id })` and then access the record's fields directly."
    );
    const record = this.#sourceCache.getRecordSync(identity);
    return record?.keys?.[key];
  }

  /**
   * @deprecated
   */
  peekAttribute(identity: RecordIdentity, attribute: string): any {
    deprecate(
      "Cache#peekAttribute is deprecated. Instead of `cache.peekAttribute({ type, id }, attribute)`, call `cache.findRecord({ type, id })` and then access the record's fields directly."
    );
    const record = this.#sourceCache.getRecordSync(identity);
    return record?.attributes?.[attribute];
  }

  /**
   * @deprecated
   */
  peekRelatedRecord(
    identity: RecordIdentity,
    relationship: string
  ): Model | null | undefined {
    deprecate(
      "Cache#peekRelatedRecord is deprecated. Instead of `cache.peekRelatedRecord({ type, id }, relationship)`, call `cache.findRecord({ type, id })` and then access the record's fields directly."
    );
    const relatedRecord = this.#sourceCache.getRelatedRecordSync(
      identity,
      relationship
    );
    if (relatedRecord) {
      return this.lookup(relatedRecord) as Model;
    } else {
      return relatedRecord;
    }
  }

  /**
   * @deprecated
   */
  peekRelatedRecords(
    identity: RecordIdentity,
    relationship: string
  ): Model[] | undefined {
    deprecate(
      "Cache#peekRelatedRecords is deprecated. Instead of `cache.peekRelatedRecords({ type, id }, relationship)`, call `cache.findRecord({ type, id })` and then access the record's fields directly."
    );
    const relatedRecords = this.#sourceCache.getRelatedRecordsSync(
      identity,
      relationship
    );
    if (relatedRecords) {
      return relatedRecords.map((r) => this.lookup(r) as Model);
    } else {
      return undefined;
    }
  }

  query<
    RequestData extends RecordQueryResult<Model> = RecordQueryResult<Model>
  >(
    queryOrExpressions: ModelAwareQueryOrExpressions,
    options?: DefaultRequestOptions<RecordCacheQueryOptions>,
    id?: string
  ): RequestData;
  query<
    RequestData extends RecordQueryResult<Model> = RecordQueryResult<Model>
  >(
    queryOrExpressions: ModelAwareQueryOrExpressions,
    options: FullRequestOptions<RecordCacheQueryOptions>,
    id?: string
  ): FullResponse<RequestData, undefined, RecordOperation>;
  query<
    RequestData extends RecordQueryResult<Model> = RecordQueryResult<Model>
  >(
    queryOrExpressions: ModelAwareQueryOrExpressions,
    options?: RecordCacheQueryOptions,
    id?: string
  ): RequestData | FullResponse<RequestData, undefined, RecordOperation> {
    const query = buildQuery(
      queryOrExpressions,
      options,
      id,
      this.#sourceCache.queryBuilder
    );

    if (options?.fullResponse) {
      const response = this.#sourceCache.query(query, { fullResponse: true });
      const data = this._lookupQueryResult(
        response.data,
        Array.isArray(query.expressions)
      );
      return {
        ...response,
        data
      } as FullResponse<RequestData, undefined, RecordOperation>;
    } else {
      const response = this.#sourceCache.query(query);
      const data = this._lookupQueryResult(
        response,
        Array.isArray(query.expressions)
      );
      return data as RequestData;
    }
  }

  liveQuery(
    queryOrExpressions: ModelAwareQueryOrExpressions,
    options?: DefaultRequestOptions<RecordCacheQueryOptions>,
    id?: string
  ): LiveQuery {
    const query = buildQuery(
      queryOrExpressions,
      options,
      id,
      this.#sourceCache.queryBuilder
    );
    const liveQuery = this.#sourceCache.liveQuery(query);
    return new LiveQuery({ liveQuery, cache: this, query });
  }

  /**
   * @deprecated
   */
  find(type: string, id?: string): Model | Model[] | undefined {
    deprecate(
      '`Cache#find` is deprecated. Call `cache.findRecords(type)`, `cache.findRecord(type, id)`, or `cache.query(...)` instead.'
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
    options?: DefaultRequestOptions<RecordCacheQueryOptions>
  ): Model | undefined;
  findRecord(
    identity: RecordIdentityOrModel,
    options?: DefaultRequestOptions<RecordCacheQueryOptions>
  ): Model | undefined;
  findRecord(
    typeOrIdentity: string | RecordIdentityOrModel,
    idOrOptions?: string | DefaultRequestOptions<RecordCacheQueryOptions>,
    options?: DefaultRequestOptions<RecordCacheQueryOptions>
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
          '`Cache#findRecord` may be called with either `type` and `id` strings OR a single `identity` object.'
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
    options?: DefaultRequestOptions<RecordCacheQueryOptions>
  ): Model[] {
    if (options?.fullResponse) {
      delete options.fullResponse;
    }
    return this.query(
      (q) => q.findRecords(typeOrIdentities),
      options
    ) as Model[];
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
    isArray: boolean
  ): RecordQueryResult<Model> {
    if (isArray) {
      if (Array.isArray(result)) {
        return (result as RecordQueryExpressionResult[]).map((i) =>
          this.lookupQueryExpressionResult(i)
        );
      } else {
        throw new Assertion(
          'A resultset for a query with an array of `expressions` should also be an array.'
        );
      }
    } else {
      return this.lookupQueryExpressionResult(
        result as RecordQueryExpressionResult<InitializedRecord>
      );
    }
  }

  _lookupTransformResult(
    result: RecordTransformResult<InitializedRecord>,
    isArray: boolean
  ): RecordTransformResult<Model> {
    if (isArray) {
      if (Array.isArray(result)) {
        return (result as RecordOperationResult[]).map((i) =>
          this.lookupOperationResult(i)
        );
      } else {
        throw new Assertion(
          'A resultset for a transform with an array of `operations` should also be an array.'
        );
      }
    } else {
      if (Array.isArray(result)) {
        throw new Assertion(
          'A resultset for a transform with singular (i.e. non-array) `operations` should not be an array.'
        );
      } else {
        return this.lookupOperationResult(result);
      }
    }
  }

  private lookupQueryExpressionResult(
    result: RecordQueryExpressionResult<InitializedRecord>
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
    result: RecordOperationResult<InitializedRecord>
  ): RecordOperationResult<Model> {
    if (result) {
      return this.lookup(result);
    } else {
      return result;
    }
  }

  private notifyPropertyChange(
    identity: RecordIdentity,
    property: string
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
          for (let properties of [attributes, keys, relationships]) {
            if (properties) {
              for (let property of Object.keys(properties)) {
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
