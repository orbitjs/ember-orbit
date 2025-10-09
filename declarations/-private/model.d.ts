import Cache from './cache.ts';
import type { DefaultRequestOptions, RequestOptions } from '@orbit/data';
import type { AttributeDefinition, InitializedRecord, KeyDefinition, ModelDefinition, RecordIdentity, RelationshipDefinition } from '@orbit/records';
import type { Dict } from '@orbit/utils';
export interface ModelSettings {
    cache: Cache;
    identity: RecordIdentity;
}
export default class Model {
    #private;
    protected _isDisconnected: boolean;
    protected _cache?: Cache;
    constructor(settings: ModelSettings);
    get identity(): RecordIdentity;
    get $identity(): RecordIdentity;
    get id(): string;
    get type(): string;
    get disconnected(): boolean;
    get $isDisconnected(): boolean;
    /**
     * @deprecated
     */
    getData(): InitializedRecord | undefined;
    $getData(): InitializedRecord | undefined;
    /**
     * @deprecated
     */
    getKey(field: string): string | undefined;
    $getKey(field: string): string | undefined;
    /**
     * @deprecated
     */
    replaceKey(key: string, value: string, options?: DefaultRequestOptions<RequestOptions>): void;
    $replaceKey(key: string, value: string, options?: DefaultRequestOptions<RequestOptions>): void;
    /**
     * @deprecated
     */
    getAttribute(attribute: string): unknown;
    $getAttribute(attribute: string): unknown;
    /**
     * @deprecated
     */
    replaceAttribute(attribute: string, value: unknown, options?: DefaultRequestOptions<RequestOptions>): void;
    $replaceAttribute(attribute: string, value: unknown, options?: DefaultRequestOptions<RequestOptions>): void;
    /**
     * @deprecated
     */
    getRelatedRecord(relationship: string): Model | null | undefined;
    $getRelatedRecord(relationship: string): Model | null | undefined;
    /**
     * @deprecated
     */
    replaceRelatedRecord(relationship: string, relatedRecord: Model | null, options?: DefaultRequestOptions<RequestOptions>): void;
    $replaceRelatedRecord(relationship: string, relatedRecord: Model | null, options?: DefaultRequestOptions<RequestOptions>): void;
    /**
     * @deprecated
     */
    getRelatedRecords(relationship: string): ReadonlyArray<Model> | undefined;
    $getRelatedRecords(relationship: string): ReadonlyArray<Model> | undefined;
    /**
     * @deprecated
     */
    addToRelatedRecords(relationship: string, record: Model, options?: DefaultRequestOptions<RequestOptions>): void;
    $addToRelatedRecords(relationship: string, record: Model, options?: DefaultRequestOptions<RequestOptions>): void;
    /**
     * @deprecated
     */
    removeFromRelatedRecords(relationship: string, record: Model, options?: DefaultRequestOptions<RequestOptions>): void;
    $removeFromRelatedRecords(relationship: string, record: Model, options?: DefaultRequestOptions<RequestOptions>): void;
    /**
     * @deprecated
     */
    replaceAttributes(properties: Dict<unknown>, options?: DefaultRequestOptions<RequestOptions>): void;
    /**
     * @deprecated
     */
    update(properties: Dict<unknown>, options?: DefaultRequestOptions<RequestOptions>): void;
    $update(properties: Dict<unknown>, options?: DefaultRequestOptions<RequestOptions>): void;
    /**
     * @deprecated
     */
    remove(options?: DefaultRequestOptions<RequestOptions>): void;
    $remove(options?: DefaultRequestOptions<RequestOptions>): void;
    /**
     * @deprecated
     */
    disconnect(): void;
    $disconnect(): void;
    /**
     * @deprecated
     */
    destroy(): void;
    $destroy(): void;
    /**
     * @deprecated
     */
    notifyPropertyChange(key: string): void;
    $notifyPropertyChange(key: string): void;
    get $cache(): Cache;
    static get definition(): ModelDefinition;
    static get keys(): Dict<KeyDefinition>;
    static get attributes(): Dict<AttributeDefinition>;
    static get relationships(): Dict<RelationshipDefinition>;
    static create(injections: ModelSettings): Model;
}
//# sourceMappingURL=model.d.ts.map