import { registerDestructor } from '@ember/destroyable';
import { Orbit } from '@orbit/core';
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
  RecordQuery,
  RecordQueryExpressionResult,
  RecordQueryResult,
  RecordSchema,
  RecordTransform,
  RecordTransformResult,
  StandardRecordValidator
} from '@orbit/records';
import { deepGet } from '@orbit/utils';
import { StandardValidator, ValidatorForFn } from '@orbit/validators';
import LiveQuery from './live-query';
import Model from './model';
import ModelFactory from './model-factory';
import {
  ModelAwareQueryBuilder,
  ModelAwareQueryOrExpressions,
  ModelAwareTransformBuilder
} from './utils/model-aware-types';
import recordIdentitySerializer from './utils/record-identity-serializer';

const { assert } = Orbit;

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

  peekRecordData(type: string, id: string): InitializedRecord | undefined {
    return this.#sourceCache.getRecordSync({ type, id });
  }

  includesRecord(type: string, id: string): boolean {
    return !!this.peekRecordData(type, id);
  }

  peekRecord(type: string, id: string): Model | undefined {
    if (this.includesRecord(type, id)) {
      return this.lookup({ type, id }) as Model;
    }
    return undefined;
  }

  peekRecords(type: string): Model[] {
    const identities = this.#sourceCache.getRecordsSync(type);
    return identities.map((i) => this.lookup(i) as Model);
  }

  peekRecordByKey(
    type: string,
    keyName: string,
    keyValue: string
  ): Model | undefined {
    return this.peekRecord(type, this.recordIdFromKey(type, keyName, keyValue));
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

  peekKey(identity: RecordIdentity, key: string): string | undefined {
    const record = this.#sourceCache.getRecordSync(identity);
    return record && deepGet(record, ['keys', key]);
  }

  peekAttribute(identity: RecordIdentity, attribute: string): any {
    const record = this.#sourceCache.getRecordSync(identity);
    return record && deepGet(record, ['attributes', attribute]);
  }

  peekRelatedRecord(
    identity: RecordIdentity,
    relationship: string
  ): Model | null | undefined {
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

  peekRelatedRecords(
    identity: RecordIdentity,
    relationship: string
  ): Model[] | undefined {
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
      return {
        ...response,
        data: this.lookupQueryResult(query, response.data)
      } as FullResponse<RequestData, undefined, RecordOperation>;
    } else {
      const data = this.#sourceCache.query(query);
      return this.lookupQueryResult(query, data) as RequestData;
    }
  }

  liveQuery(
    queryOrExpressions: ModelAwareQueryOrExpressions,
    options?: RequestOptions,
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

  find(type: string, id?: string): Model | Model[] {
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
  ): Model {
    return this.query((q) => q.findRecord({ type, id }), options) as Model;
  }

  findRecords(
    type: string,
    options?: DefaultRequestOptions<RecordCacheQueryOptions>
  ): Model[] {
    return this.query((q) => q.findRecords(type), options) as Model[];
  }

  unload(identity: RecordIdentity): void {
    const record = this._identityMap.get(identity);
    if (record) {
      record.$disconnect();
      this._identityMap.delete(identity);
    }
  }

  lookup(record: InitializedRecord): Model {
    let model = this._identityMap.get(record);

    if (!model) {
      model = this.#modelFactory.create(record);
      this._identityMap.set(record, model);
    }

    return model;
  }

  lookupQueryResult(
    query: RecordQuery,
    result: RecordQueryResult<InitializedRecord>
  ): RecordQueryResult<Model> {
    if (
      isQueryExpressionResultArray<InitializedRecord>(
        result,
        query.expressions.length
      )
    ) {
      return (result as RecordQueryExpressionResult<InitializedRecord>[]).map(
        (i) => this.lookupQueryExpressionResult(i)
      );
    } else {
      return this.lookupQueryExpressionResult(result);
    }
  }

  lookupTransformResult(
    transform: RecordTransform,
    result: RecordTransformResult<InitializedRecord>
  ): RecordTransformResult<Model> {
    if (
      isOperationResultArray<InitializedRecord>(
        result,
        transform.operations.length
      )
    ) {
      return result.map((i) => this.lookupOperationResult(i));
    } else {
      return this.lookupOperationResult(result);
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

function isQueryExpressionResultArray<T>(
  _result: RecordQueryResult<T>,
  expressions: number
): _result is RecordQueryExpressionResult<T>[] {
  return expressions > 1;
}

function isOperationResultArray<T>(
  _result: RecordTransformResult<T>,
  operations: number
): _result is RecordOperationResult<T>[] {
  return operations > 1;
}
