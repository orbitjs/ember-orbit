import Cache from './cache.ts';
import LiveQuery from './live-query.ts';
import Model from './model.ts';
import { ModelAwareQueryBuilder, ModelAwareTransformBuilder, type ModelAwareQueryOrExpressions, type ModelAwareTransformOrOperations, type RecordIdentityOrModel } from './utils/model-aware-types.ts';
import type { ModelFields } from './utils/model-fields.ts';
import { type Listener, type Log, type TaskQueue } from '@orbit/core';
import { type DefaultRequestOptions, type FullRequestOptions, type FullResponse, type RequestOptions, type TransformBuilderFunc } from '@orbit/data';
import type MemorySource from '@orbit/memory';
import type { MemorySourceMergeOptions, MemorySourceSettings } from '@orbit/memory';
import type { RecordCacheQueryOptions } from '@orbit/record-cache';
import { RecordKeyMap, RecordSchema, type InitializedRecord, type RecordOperation, type RecordQueryResult, type RecordSourceQueryOptions, type RecordTransform, type RecordTransformResult, type StandardRecordValidator, type UninitializedRecord } from '@orbit/records';
import type { StandardValidator, ValidatorForFn } from '@orbit/validators';
export interface StoreSettings {
    source: MemorySource<RecordSourceQueryOptions, RequestOptions, ModelAwareQueryBuilder, ModelAwareTransformBuilder>;
    base?: Store;
}
/**
 * @class Store
 */
export default class Store {
    #private;
    static create(injections: StoreSettings): Store;
    constructor(settings: StoreSettings);
    destroy(): void;
    get source(): MemorySource<RecordSourceQueryOptions, RequestOptions, ModelAwareQueryBuilder, ModelAwareTransformBuilder>;
    get cache(): Cache;
    get keyMap(): RecordKeyMap | undefined;
    get schema(): RecordSchema;
    get queryBuilder(): ModelAwareQueryBuilder;
    get transformBuilder(): ModelAwareTransformBuilder;
    get validatorFor(): ValidatorForFn<StandardValidator | StandardRecordValidator> | undefined;
    get defaultQueryOptions(): DefaultRequestOptions<RecordSourceQueryOptions> | undefined;
    set defaultQueryOptions(options: DefaultRequestOptions<RecordSourceQueryOptions> | undefined);
    get defaultTransformOptions(): DefaultRequestOptions<RequestOptions> | undefined;
    set defaultTransformOptions(options: DefaultRequestOptions<RequestOptions> | undefined);
    get transformLog(): Log;
    get requestQueue(): TaskQueue;
    get syncQueue(): TaskQueue;
    /**
     * @deprecated use `isForked` instead
     */
    get forked(): boolean;
    get isForked(): boolean;
    get base(): Store | undefined;
    fork(settings?: Partial<MemorySourceSettings<RecordSourceQueryOptions, RequestOptions, ModelAwareQueryBuilder, ModelAwareTransformBuilder>>): Store;
    merge<RequestData extends RecordTransformResult<Model> = RecordTransformResult<Model>>(forkedStore: Store, options?: DefaultRequestOptions<RequestOptions> & MemorySourceMergeOptions): Promise<RequestData>;
    merge<RequestData extends RecordTransformResult<Model> = RecordTransformResult<Model>>(forkedStore: Store, options: FullRequestOptions<RequestOptions> & MemorySourceMergeOptions): Promise<FullResponse<RequestData, unknown, RecordOperation>>;
    rollback(transformId: string, relativePosition?: number): Promise<void>;
    rebase(): void;
    reset(): Promise<void>;
    /**
     * @deprecated
     */
    liveQuery(queryOrExpressions: ModelAwareQueryOrExpressions, options?: DefaultRequestOptions<RecordCacheQueryOptions>, id?: string): Promise<LiveQuery>;
    query<RequestData extends RecordQueryResult<Model> = RecordQueryResult<Model>>(queryOrExpressions: ModelAwareQueryOrExpressions, options?: DefaultRequestOptions<RecordCacheQueryOptions>, id?: string): Promise<RequestData>;
    query<RequestData extends RecordQueryResult<Model> = RecordQueryResult<Model>>(queryOrExpressions: ModelAwareQueryOrExpressions, options: FullRequestOptions<RecordCacheQueryOptions>, id?: string): Promise<FullResponse<RequestData, undefined, RecordOperation>>;
    /**
     * Adds a record
     */
    addRecord<RequestData extends RecordTransformResult<Model> = Model>(properties: UninitializedRecord | ModelFields, options?: DefaultRequestOptions<RecordCacheQueryOptions>): Promise<RequestData>;
    /**
     * Updates a record
     */
    updateRecord<RequestData extends RecordTransformResult<Model> = Model>(properties: InitializedRecord | ModelFields, options?: DefaultRequestOptions<RecordCacheQueryOptions>): Promise<RequestData>;
    /**
     * Updates a record's fields. Distinct from updateRecord in that updateRecordFields takes a record identity as a separate argument
     * from the fields to update.
     */
    updateRecordFields<RequestData extends RecordTransformResult<Model> = Model>(identity: RecordIdentityOrModel, fields: Partial<InitializedRecord> | Partial<ModelFields>, options?: DefaultRequestOptions<RecordCacheQueryOptions>): Promise<RequestData>;
    /**
     * Removes a record
     */
    removeRecord(identity: RecordIdentityOrModel, options?: DefaultRequestOptions<RecordCacheQueryOptions>): Promise<void>;
    /**
     * @deprecated
     */
    find(type: string, id?: string, options?: DefaultRequestOptions<RecordCacheQueryOptions>): Promise<Model | Model[] | undefined>;
    findRecord<RequestData extends RecordQueryResult<Model> = Model | undefined>(type: string, id: string, options?: DefaultRequestOptions<RecordCacheQueryOptions>): Promise<Model | undefined>;
    findRecord<RequestData extends RecordQueryResult<Model> = Model | undefined>(identity: RecordIdentityOrModel, options?: DefaultRequestOptions<RecordCacheQueryOptions>): Promise<Model | undefined>;
    findRecords<RequestData extends RecordQueryResult<Model> = Model[]>(typeOrIdentities: string | RecordIdentityOrModel[], options?: DefaultRequestOptions<RecordCacheQueryOptions>): Promise<RequestData>;
    /**
     * @deprecated
     */
    findRecordByKey(type: string, key: string, value: string, options?: DefaultRequestOptions<RecordCacheQueryOptions>): Promise<Model | undefined>;
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
    on(event: string, listener: Listener): void;
    off(event: string, listener: Listener): void;
    one(event: string, listener: Listener): void;
    sync(transformOrTransforms: RecordTransform | RecordTransform[] | TransformBuilderFunc<RecordOperation, ModelAwareTransformBuilder>): Promise<void>;
    update<RequestData extends RecordTransformResult<Model> = RecordTransformResult<Model>>(transformOrOperations: ModelAwareTransformOrOperations, options?: DefaultRequestOptions<RequestOptions>, id?: string): Promise<RequestData>;
    update<RequestData extends RecordTransformResult<Model> = RecordTransformResult<Model>>(transformOrOperations: ModelAwareTransformOrOperations, options: FullRequestOptions<RequestOptions>, id?: string): Promise<FullResponse<RequestData, unknown, RecordOperation>>;
    transformsSince(transformId: string): RecordTransform[];
    getTransformsSince(transformId: string): RecordTransform[];
    allTransforms(): RecordTransform[];
    getAllTransforms(): RecordTransform[];
    getTransform(transformId: string): RecordTransform;
    getInverseOperations(transformId: string): RecordOperation[];
}
//# sourceMappingURL=store.d.ts.map