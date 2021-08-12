import { Assertion, Orbit } from '@orbit/core';
import { Dict } from '@orbit/utils';
import { DefaultRequestOptions, RequestOptions } from '@orbit/data';
import {
  RecordIdentity,
  KeyDefinition,
  AttributeDefinition,
  RelationshipDefinition,
  InitializedRecord,
  ModelDefinition
} from '@orbit/records';
import {
  destroy,
  associateDestroyableChild,
  registerDestructor
} from '@ember/destroyable';
import { tracked } from '@glimmer/tracking';

import Cache from './cache';
import { getModelDefinition } from './utils/model-definition';
import { notifyPropertyChange } from './utils/property-cache';

const { assert, deprecate } = Orbit;

export interface ModelSettings {
  cache: Cache;
  identity: RecordIdentity;
}
export default class Model {
  @tracked protected _isDisconnected = false;
  protected _cache?: Cache;
  #identity: RecordIdentity;

  constructor(settings: ModelSettings) {
    const { cache, identity } = settings;

    assert('Model must be initialized with a cache', cache !== undefined);

    this._cache = cache;
    this.#identity = identity;
    associateDestroyableChild(cache, this);
    registerDestructor(this, (record) => cache.unload(record));
  }

  get identity(): RecordIdentity {
    deprecate(
      '`Model#identity` is deprecated to avoid potential conflicts with field names. Access `$identity` instead.'
    );
    return this.#identity;
  }

  get $identity(): RecordIdentity {
    return this.#identity;
  }

  get id(): string {
    return this.#identity.id;
  }

  get type(): string {
    return this.#identity.type;
  }

  get disconnected(): boolean {
    deprecate(
      '`Model#disconnected` is deprecated to avoid potential conflicts with field names. Access `$isDisconnected` instead.'
    );
    return this.$isDisconnected;
  }

  get $isDisconnected(): boolean {
    return this._isDisconnected;
  }

  /**
   * @deprecated
   */
  getData(): InitializedRecord | undefined {
    deprecate(
      '`Model#getData` is deprecated to avoid potential conflicts with field names. Call `$getData` instead.'
    );
    return this.$getData();
  }

  $getData(): InitializedRecord | undefined {
    return this.$cache.getRecordData(this.type, this.id);
  }

  /**
   * @deprecated
   */
  getKey(field: string): string | undefined {
    deprecate(
      '`Model#getKey` is deprecated to avoid potential conflicts with field names. Call `$getKey` instead.'
    );
    return this.$getKey(field);
  }

  $getKey(field: string): string | undefined {
    return this.$getData()?.keys?.[field];
  }

  /**
   * @deprecated
   */
  replaceKey(
    key: string,
    value: string,
    options?: DefaultRequestOptions<RequestOptions>
  ): void {
    deprecate(
      '`Model#replaceKey` is deprecated to avoid potential conflicts with field names. Call `$replaceKey` instead.'
    );
    this.$replaceKey(key, value, options);
  }

  $replaceKey(
    key: string,
    value: string,
    options?: DefaultRequestOptions<RequestOptions>
  ): void {
    this.$cache.update(
      (t) => t.replaceKey(this.#identity, key, value),
      options
    );
  }

  /**
   * @deprecated
   */
  getAttribute(attribute: string): unknown {
    deprecate(
      '`Model#getAttribute` is deprecated to avoid potential conflicts with field names. Call `$getAttribute` instead.'
    );
    return this.$getAttribute(attribute);
  }

  $getAttribute(attribute: string): unknown {
    return this.$getData()?.attributes?.[attribute];
  }

  /**
   * @deprecated
   */
  replaceAttribute(
    attribute: string,
    value: unknown,
    options?: DefaultRequestOptions<RequestOptions>
  ): void {
    deprecate(
      '`Model#replaceAttribute` is deprecated to avoid potential conflicts with field names. Call `$replaceAttribute` instead.'
    );
    this.$replaceAttribute(attribute, value, options);
  }

  $replaceAttribute(
    attribute: string,
    value: unknown,
    options?: DefaultRequestOptions<RequestOptions>
  ): void {
    this.$cache.update(
      (t) => t.replaceAttribute(this.#identity, attribute, value),
      options
    );
  }

  /**
   * @deprecated
   */
  getRelatedRecord(relationship: string): Model | null | undefined {
    deprecate(
      '`Model#getRelatedRecord` is deprecated to avoid potential conflicts with field names. Call `$getRelatedRecord` instead.'
    );
    return this.$getRelatedRecord(relationship);
  }

  $getRelatedRecord(relationship: string): Model | null | undefined {
    const cache = this.$cache;
    const relatedRecord = cache.sourceCache.getRelatedRecordSync(
      this.#identity,
      relationship
    );
    if (relatedRecord) {
      return cache.lookup(relatedRecord) as Model;
    } else {
      return relatedRecord;
    }
  }

  /**
   * @deprecated
   */
  replaceRelatedRecord(
    relationship: string,
    relatedRecord: Model | null,
    options?: DefaultRequestOptions<RequestOptions>
  ): void {
    deprecate(
      '`Model#replaceRelatedRecord` is deprecated to avoid potential conflicts with field names. Call `$replaceRelatedRecord` instead.'
    );
    this.$replaceRelatedRecord(relationship, relatedRecord, options);
  }

  $replaceRelatedRecord(
    relationship: string,
    relatedRecord: Model | null,
    options?: DefaultRequestOptions<RequestOptions>
  ): void {
    this.$cache.update(
      (t) =>
        t.replaceRelatedRecord(
          this.#identity,
          relationship,
          relatedRecord ? relatedRecord.$identity : null
        ),
      options
    );
  }

  /**
   * @deprecated
   */
  getRelatedRecords(relationship: string): ReadonlyArray<Model> | undefined {
    deprecate(
      '`Model#getRelatedRecords` is deprecated to avoid potential conflicts with field names. Call `$getRelatedRecords` instead.'
    );
    return this.$getRelatedRecords(relationship);
  }

  $getRelatedRecords(relationship: string): ReadonlyArray<Model> | undefined {
    const cache = this.$cache;
    const relatedRecords = cache.sourceCache.getRelatedRecordsSync(
      this.#identity,
      relationship
    );

    if (relatedRecords) {
      return relatedRecords.map((r) => cache.lookup(r));
    } else {
      return undefined;
    }
  }

  /**
   * @deprecated
   */
  addToRelatedRecords(
    relationship: string,
    record: Model,
    options?: DefaultRequestOptions<RequestOptions>
  ): void {
    deprecate(
      '`Model#addToRelatedRecords` is deprecated to avoid potential conflicts with field names. Call `$addToRelatedRecords` instead.'
    );
    this.$addToRelatedRecords(relationship, record, options);
  }

  $addToRelatedRecords(
    relationship: string,
    record: Model,
    options?: DefaultRequestOptions<RequestOptions>
  ): void {
    this.$cache.update(
      (t) =>
        t.addToRelatedRecords(this.#identity, relationship, record.$identity),
      options
    );
  }

  /**
   * @deprecated
   */
  removeFromRelatedRecords(
    relationship: string,
    record: Model,
    options?: DefaultRequestOptions<RequestOptions>
  ): void {
    deprecate(
      '`Model#removeFromRelatedRecords` is deprecated to avoid potential conflicts with field names. Call `$removeFromRelatedRecords` instead.'
    );
    this.$removeFromRelatedRecords(relationship, record, options);
  }

  $removeFromRelatedRecords(
    relationship: string,
    record: Model,
    options?: DefaultRequestOptions<RequestOptions>
  ): void {
    this.$cache.update(
      (t) =>
        t.removeFromRelatedRecords(
          this.#identity,
          relationship,
          record.$identity
        ),
      options
    );
  }

  /**
   * @deprecated
   */
  replaceAttributes(
    properties: Dict<unknown>,
    options?: DefaultRequestOptions<RequestOptions>
  ): void {
    deprecate(
      '`Model#replaceAttributes` is deprecated. Call `$update` instead (with the same arguments).'
    );
    this.$update(properties, options);
  }

  /**
   * @deprecated
   */
  update(
    properties: Dict<unknown>,
    options?: DefaultRequestOptions<RequestOptions>
  ): void {
    deprecate(
      '`Model#update` is deprecated to avoid potential conflicts with field names. Call `$update` instead.'
    );
    this.$update(properties, options);
  }

  $update(
    properties: Dict<unknown>,
    options?: DefaultRequestOptions<RequestOptions>
  ): void {
    this.$cache.update(
      (t) =>
        t.updateRecord({
          ...properties,
          ...this.#identity
        }),
      options
    );
  }

  /**
   * @deprecated
   */
  remove(options?: DefaultRequestOptions<RequestOptions>): void {
    deprecate(
      '`Model#remove` is deprecated to avoid potential conflicts with field names. Call `$remove` instead.'
    );
    this.$remove(options);
  }

  $remove(options?: DefaultRequestOptions<RequestOptions>): void {
    this.$cache.update((t) => t.removeRecord(this.#identity), options);
  }

  /**
   * @deprecated
   */
  disconnect(): void {
    deprecate(
      '`Model#disconnect` is deprecated to avoid potential conflicts with field names. Call `$disconnect` instead.'
    );
    this.$disconnect();
  }

  $disconnect(): void {
    this._cache = undefined;
    this._isDisconnected = true;
  }

  /**
   * @deprecated
   */
  destroy(): void {
    deprecate(
      '`Model#destroy` is deprecated to avoid potential conflicts with field names. Call `$destroy` instead.'
    );
    this.$destroy();
  }

  $destroy(): void {
    destroy(this);
  }

  /**
   * @deprecated
   */
  notifyPropertyChange(key: string) {
    deprecate(
      '`Model#notifyPropertyChange` is deprecated to avoid potential conflicts with field names. Call `$notifyPropertyChange` instead.'
    );
    this.$notifyPropertyChange(key);
  }

  $notifyPropertyChange(key: string) {
    notifyPropertyChange(this, key);
  }

  get $cache(): Cache {
    if (this._cache === undefined) {
      throw new Assertion('Record has been disconnected from its cache.');
    }

    return this._cache;
  }

  static get definition(): ModelDefinition {
    return getModelDefinition(this.prototype);
  }

  static get keys(): Dict<KeyDefinition> {
    return getModelDefinition(this.prototype).keys ?? {};
  }

  static get attributes(): Dict<AttributeDefinition> {
    return getModelDefinition(this.prototype).attributes ?? {};
  }

  static get relationships(): Dict<RelationshipDefinition> {
    return getModelDefinition(this.prototype).relationships ?? {};
  }

  static create(injections: ModelSettings) {
    const { identity, cache, ...otherInjections } = injections;
    const record = new this({ identity, cache });
    return Object.assign(record, otherInjections);
  }
}
