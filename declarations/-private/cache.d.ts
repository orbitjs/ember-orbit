import LiveQuery from './live-query.ts';
import type Model from './model.ts';
import type Store from './store.ts';
import { ModelAwareQueryBuilder, ModelAwareTransformBuilder, type ModelAwareQueryOrExpressions, type ModelAwareTransformOrOperations, type RecordIdentityOrModel } from './utils/model-aware-types.ts';
import type { ModelFields } from './utils/model-fields.ts';
import { type DefaultRequestOptions, type FullRequestOptions, type FullResponse, type RequestOptions } from '@orbit/data';
import IdentityMap from '@orbit/identity-map';
import { type MemoryCache, type MemoryCacheMergeOptions, type MemoryCacheSettings } from '@orbit/memory';
import type { RecordCacheQueryOptions, RecordCacheTransformOptions } from '@orbit/record-cache';
import { RecordKeyMap, RecordSchema, type InitializedRecord, type RecordIdentity, type RecordOperation, type RecordQueryResult, type RecordTransformResult, type StandardRecordValidator, type UninitializedRecord } from '@orbit/records';
import type { StandardValidator, ValidatorForFn } from '@orbit/validators';
export interface CacheSettings {
    sourceCache: MemoryCache;
    store?: Store;
    base?: Cache;
}
export default class Cache {
    #private;
    allowUpdates: boolean;
    protected _identityMap: IdentityMap<RecordIdentity, Model>;
    constructor(settings: CacheSettings);
    get sourceCache(): MemoryCache;
    get store(): Store | undefined;
    get keyMap(): RecordKeyMap | undefined;
    get schema(): RecordSchema;
    get queryBuilder(): ModelAwareQueryBuilder;
    get transformBuilder(): ModelAwareTransformBuilder;
    get validatorFor(): ValidatorForFn<StandardValidator | StandardRecordValidator> | undefined;
    get defaultQueryOptions(): DefaultRequestOptions<RecordCacheQueryOptions> | undefined;
    set defaultQueryOptions(options: DefaultRequestOptions<RecordCacheQueryOptions> | undefined);
    get defaultTransformOptions(): DefaultRequestOptions<RecordCacheTransformOptions> | undefined;
    set defaultTransformOptions(options: DefaultRequestOptions<RecordCacheTransformOptions> | undefined);
    get isForked(): boolean;
    get base(): Cache | undefined;
    fork(settings?: Partial<MemoryCacheSettings<RecordCacheQueryOptions, RecordCacheTransformOptions, ModelAwareQueryBuilder, ModelAwareTransformBuilder>>): Cache;
    merge<RequestData extends RecordTransformResult<Model> = RecordTransformResult<Model>>(forkedCache: Cache, options?: DefaultRequestOptions<RequestOptions> & MemoryCacheMergeOptions): RequestData;
    merge<RequestData extends RecordTransformResult<Model> = RecordTransformResult<Model>>(forkedCache: Cache, options: FullRequestOptions<RequestOptions> & MemoryCacheMergeOptions): FullResponse<RequestData, unknown, RecordOperation>;
    rebase(): void;
    reset(): void;
    getRecordData(type: string, id: string): InitializedRecord | undefined;
    includesRecord(type: string, id: string): boolean;
    recordIdFromKey(type: string, keyName: string, keyValue: string): string;
    /**
     * @deprecated
     */
    peekRecordData(type: string, id: string): InitializedRecord | undefined;
    /**
     * @deprecated
     */
    peekRecord(type: string, id: string): Model | undefined;
    /**
     * @deprecated
     */
    peekRecords(type: string): Model[];
    /**
     * @deprecated
     */
    peekRecordByKey(type: string, key: string, value: string): Model | undefined;
    /**
     * @deprecated
     */
    peekKey(identity: RecordIdentity, key: string): string | undefined;
    /**
     * @deprecated
     */
    peekAttribute(identity: RecordIdentity, attribute: string): any;
    /**
     * @deprecated
     */
    peekRelatedRecord(identity: RecordIdentity, relationship: string): Model | null | undefined;
    /**
     * @deprecated
     */
    peekRelatedRecords(identity: RecordIdentity, relationship: string): Model[] | undefined;
    update<RequestData extends RecordTransformResult<Model> = RecordTransformResult<Model>>(transformOrOperations: ModelAwareTransformOrOperations, options?: DefaultRequestOptions<RequestOptions>, id?: string): RequestData;
    update<RequestData extends RecordTransformResult<Model> = RecordTransformResult<Model>>(transformOrOperations: ModelAwareTransformOrOperations, options: FullRequestOptions<RequestOptions>, id?: string): FullResponse<RequestData, unknown, RecordOperation>;
    query<RequestData extends RecordQueryResult<Model> = RecordQueryResult<Model>>(queryOrExpressions: ModelAwareQueryOrExpressions, options?: DefaultRequestOptions<RecordCacheQueryOptions>, id?: string): RequestData;
    query<RequestData extends RecordQueryResult<Model> = RecordQueryResult<Model>>(queryOrExpressions: ModelAwareQueryOrExpressions, options: FullRequestOptions<RecordCacheQueryOptions>, id?: string): FullResponse<RequestData, undefined, RecordOperation>;
    liveQuery(queryOrExpressions: ModelAwareQueryOrExpressions, options?: DefaultRequestOptions<RecordCacheQueryOptions>, id?: string): LiveQuery;
    /**
     * @deprecated
     */
    find(type: string, id?: string): Model | Model[] | undefined;
    findRecord(type: string, id: string, options?: DefaultRequestOptions<RecordCacheQueryOptions>): Model | undefined;
    findRecord(identity: RecordIdentityOrModel, options?: DefaultRequestOptions<RecordCacheQueryOptions>): Model | undefined;
    findRecords(typeOrIdentities: string | RecordIdentityOrModel[], options?: DefaultRequestOptions<RecordCacheQueryOptions>): Model[];
    /**
     * Adds a record
     */
    addRecord<RequestData extends RecordTransformResult<Model> = Model>(properties: UninitializedRecord | ModelFields, options?: DefaultRequestOptions<RecordCacheQueryOptions>): RequestData;
    /**
     * Updates a record
     */
    updateRecord<RequestData extends RecordTransformResult<Model> = Model>(properties: InitializedRecord | ModelFields, options?: DefaultRequestOptions<RecordCacheQueryOptions>): RequestData;
    /**
     * Removes a record
     */
    removeRecord(identity: RecordIdentityOrModel, options?: DefaultRequestOptions<RecordCacheQueryOptions>): void;
    unload(identity: RecordIdentity): void;
    lookup(identity: RecordIdentity): Model;
    _lookupQueryResult(result: RecordQueryResult<InitializedRecord>, isArray: boolean): RecordQueryResult<Model>;
    _lookupTransformResult(result: RecordTransformResult<InitializedRecord>, isArray: boolean): RecordTransformResult<Model>;
    private lookupQueryExpressionResult;
    private lookupOperationResult;
    private notifyPropertyChange;
    private generatePatchListener;
}
//# sourceMappingURL=cache.d.ts.map