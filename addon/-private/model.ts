import { Orbit } from '@orbit/core';
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

import Store from './store';
import { getModelDefinition } from './utils/model-definition';
import { notifyPropertyChange } from './utils/property-cache';

const { assert, deprecate } = Orbit;

export interface ModelSettings {
  store: Store;
  identity: RecordIdentity;
  mutableFields: boolean;
}
export default class Model {
  @tracked protected _store?: Store;
  #identity: RecordIdentity;
  #mutableFields: boolean;

  constructor(settings: ModelSettings) {
    this._store = settings.store;
    this.#identity = settings.identity;
    this.#mutableFields = settings.mutableFields;
    associateDestroyableChild(settings.store, this);
    registerDestructor(this, (record) => settings.store.cache.unload(record));
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
      '`Model#disconnected` is deprecated to avoid potential conflicts with field names. Access `$disconnected` instead.'
    );
    return this.$disconnected;
  }

  get $disconnected(): boolean {
    return !this._store;
  }

  /**
   * @deprecated
   */
  getData(): InitializedRecord {
    deprecate(
      '`Model#getData` is deprecated to avoid potential conflicts with field names. Call `$getData` instead.'
    );
    return this.$getData();
  }

  $getData(): InitializedRecord {
    assert(
      'Model must be connected to a store in order to call `$getData`',
      this._store !== undefined
    );
    const data = this._store!.cache.getRecordData(this.type, this.id);
    assert(
      "`$getData` can not succeed because the record associated with the model no longer exists in its store's cache.",
      data !== undefined
    );
    return data as InitializedRecord;
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
  async replaceKey(
    key: string,
    value: string,
    options?: DefaultRequestOptions<RequestOptions>
  ): Promise<void> {
    deprecate(
      '`Model#replaceKey` is deprecated to avoid potential conflicts with field names. Call `$replaceKey` instead.'
    );
    await this.$replaceKey(key, value, options);
  }

  async $replaceKey(
    key: string,
    value: string,
    options?: DefaultRequestOptions<RequestOptions>
  ): Promise<void> {
    await this._store!.update(
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
  async replaceAttribute(
    attribute: string,
    value: unknown,
    options?: DefaultRequestOptions<RequestOptions>
  ): Promise<void> {
    deprecate(
      '`Model#replaceAttribute` is deprecated to avoid potential conflicts with field names. Call `$replaceAttribute` instead.'
    );
    await this.$replaceAttribute(attribute, value, options);
  }

  async $replaceAttribute(
    attribute: string,
    value: unknown,
    options?: DefaultRequestOptions<RequestOptions>
  ): Promise<void> {
    await this._store!.update(
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
    const cache = this._store!.cache;
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
  async replaceRelatedRecord(
    relationship: string,
    relatedRecord: Model | null,
    options?: DefaultRequestOptions<RequestOptions>
  ): Promise<void> {
    deprecate(
      '`Model#replaceRelatedRecord` is deprecated to avoid potential conflicts with field names. Call `$replaceRelatedRecord` instead.'
    );
    await this.$replaceRelatedRecord(relationship, relatedRecord, options);
  }

  async $replaceRelatedRecord(
    relationship: string,
    relatedRecord: Model | null,
    options?: DefaultRequestOptions<RequestOptions>
  ): Promise<void> {
    await this._store!.update(
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
    const cache = this._store!.cache;
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
  async addToRelatedRecords(
    relationship: string,
    record: Model,
    options?: DefaultRequestOptions<RequestOptions>
  ): Promise<void> {
    deprecate(
      '`Model#addToRelatedRecords` is deprecated to avoid potential conflicts with field names. Call `$addToRelatedRecords` instead.'
    );
    await this.$addToRelatedRecords(relationship, record, options);
  }

  async $addToRelatedRecords(
    relationship: string,
    record: Model,
    options?: DefaultRequestOptions<RequestOptions>
  ): Promise<void> {
    await this._store!.update(
      (t) =>
        t.addToRelatedRecords(this.#identity, relationship, record.$identity),
      options
    );
  }

  /**
   * @deprecated
   */
  async removeFromRelatedRecords(
    relationship: string,
    record: Model,
    options?: DefaultRequestOptions<RequestOptions>
  ): Promise<void> {
    deprecate(
      '`Model#removeFromRelatedRecords` is deprecated to avoid potential conflicts with field names. Call `$removeFromRelatedRecords` instead.'
    );
    await this.$removeFromRelatedRecords(relationship, record, options);
  }

  async $removeFromRelatedRecords(
    relationship: string,
    record: Model,
    options?: DefaultRequestOptions<RequestOptions>
  ): Promise<void> {
    await this._store!.update(
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
  async replaceAttributes(
    properties: Dict<unknown>,
    options?: DefaultRequestOptions<RequestOptions>
  ): Promise<void> {
    deprecate(
      '`Model#replaceAttributes` is deprecated. Call `$update` instead (with the same arguments).'
    );
    await this.$update(properties, options);
  }

  /**
   * @deprecated
   */
  async update(
    properties: Dict<unknown>,
    options?: DefaultRequestOptions<RequestOptions>
  ): Promise<void> {
    deprecate(
      '`Model#update` is deprecated to avoid potential conflicts with field names. Call `$update` instead.'
    );
    await this.$update(properties, options);
  }

  async $update(
    properties: Dict<unknown>,
    options?: DefaultRequestOptions<RequestOptions>
  ): Promise<void> {
    await this._store!.update(
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
  async remove(options?: DefaultRequestOptions<RequestOptions>): Promise<void> {
    deprecate(
      '`Model#remove` is deprecated to avoid potential conflicts with field names. Call `$remove` instead.'
    );
    await this.$remove(options);
  }

  async $remove(
    options?: DefaultRequestOptions<RequestOptions>
  ): Promise<void> {
    await this._store!.update((t) => t.removeRecord(this.#identity), options);
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
    this._store = undefined;
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

  /**
   * @deprecated
   */
  assertMutableFields(): void {
    deprecate(
      '`Model#assertMutableFields` is deprecated to avoid potential conflicts with field names. Call `$assertMutableFields` instead.'
    );
    this.$assertMutableFields();
  }

  $assertMutableFields(): void {
    assert(
      `You tried to directly mutate fields on the '${this.type}:${this.id}' record, which is not allowed on a store that is not a fork. Either make this change using an async method like 'update' or 'replaceAttribute' or fork the store if you need to directly mutate fields on a record.`,
      this.#mutableFields
    );
  }

  get store(): Store {
    deprecate(
      '`Model#store` is deprecated to avoid potential conflicts with field names. Access `$store` instead.'
    );
    return this.$store;
  }

  get $store(): Store {
    if (!this._store) {
      throw new Error('record has been removed its store');
    }

    return this._store;
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
    const { identity, store, mutableFields, ...otherInjections } = injections;
    const record = new this({ identity, store, mutableFields });
    return Object.assign(record, otherInjections);
  }
}
