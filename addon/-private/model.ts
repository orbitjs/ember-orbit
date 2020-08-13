import { Orbit } from '@orbit/core';
import { Dict } from '@orbit/utils';
import {
  Record,
  RecordIdentity,
  KeyDefinition,
  AttributeDefinition,
  RelationshipDefinition,
  RequestOptions
} from '@orbit/data';
import {
  destroy,
  associateDestroyableChild,
  registerDestructor
} from '@ember/destroyable';

import Store from './store';
import { RelatedRecordAccessor, RelatedRecordsAccessor } from './accessors';

const { assert } = Orbit;

export interface ModelSettings {
  identity: RecordIdentity;
  store: Store;
  mutableFields: boolean;
}

export type QueryResult<T = Model> = T | T[] | null | (T | T[] | null)[];

export default class Model {
  readonly identity!: RecordIdentity;

  #store?: Store;
  #mutableFields: boolean;

  constructor(settings: ModelSettings) {
    this.identity = settings.identity;
    this.#store = settings.store;
    this.#mutableFields = settings.mutableFields;
    associateDestroyableChild(settings.store, this);
    registerDestructor(this, (record) => settings.store.cache.unload(record));
  }

  get id(): string {
    return this.identity.id;
  }

  get type(): string {
    return this.identity.type;
  }

  get disconnected(): boolean {
    return !this.#store;
  }

  getData(): Record | undefined {
    return this.store.record(this.identity).raw();
  }

  getKey(field: string): string | undefined {
    return this.store.cache.peekKey(this.identity, field);
  }

  async replaceKey(
    key: string,
    value: string,
    options?: RequestOptions
  ): Promise<void> {
    await this.store.update(
      (t) => t.replaceKey(this.identity, key, value),
      options
    );
  }

  getAttribute(attribute: string): any {
    return this.store.cache.peekAttribute(this.identity, attribute);
  }

  /**
   * @deprecated
   */
  async replaceAttribute(
    attribute: string,
    value: unknown,
    options?: RequestOptions
  ): Promise<void> {
    await this.update({ [attribute]: value }, options);
  }

  relatedRecord(relationship: string): RelatedRecordAccessor<Model> {
    return new RelatedRecordAccessor(this.store, this.identity, relationship);
  }

  relatedRecords(relationship: string): RelatedRecordsAccessor<Model> {
    return new RelatedRecordsAccessor(this.store, this.identity, relationship);
  }

  /**
   * @deprecated
   */
  getRelatedRecord(relationship: string): Model | null | undefined {
    return this.relatedRecord(relationship).peek();
  }

  /**
   * @deprecated
   */
  async replaceRelatedRecord(
    relationship: string,
    relatedRecord: Model | null,
    options?: RequestOptions
  ): Promise<void> {
    await this.relatedRecord(relationship).replace(relatedRecord, options);
  }

  /**
   * @deprecated
   */
  getRelatedRecords(relationship: string): ReadonlyArray<Model> | undefined {
    return this.relatedRecords(relationship).peek();
  }

  /**
   * @deprecated
   */
  async addToRelatedRecords(
    relationship: string,
    record: Model,
    options?: RequestOptions
  ): Promise<void> {
    await this.relatedRecords(relationship).add(record, options);
  }

  /**
   * @deprecated
   */
  async removeFromRelatedRecords(
    relationship: string,
    record: Model,
    options?: RequestOptions
  ): Promise<void> {
    await this.relatedRecords(relationship).remove(record, options);
  }

  /**
   * @deprecated
   */
  async replaceAttributes(
    properties: Dict<unknown> = {},
    options?: RequestOptions
  ): Promise<void> {
    await this.update(properties, options);
  }

  async update(
    properties: Dict<unknown> = {},
    options?: RequestOptions
  ): Promise<void> {
    await this.store.record(this.identity).update(properties, options);
  }

  async remove(options?: RequestOptions): Promise<void> {
    await this.store.record(this.identity).remove(options);
  }

  disconnect(): void {
    this.#store = undefined;
  }

  destroy(): void {
    destroy(this);
  }

  notifyPropertyChange(key: string) {
    Reflect.getMetadata('orbit:notifier', this, key)(this);
  }

  assertMutableFields(): void {
    assert(
      `You tried to directly mutate fields on the '${this.type}:${this.id}' record, which is not allowed on a store that is not a fork. Either make this change using an async method like 'update' or 'replaceAttribute' or fork the store if you need to directly mutate fields on a record.`,
      this.#mutableFields
    );
  }

  private get store(): Store {
    if (!this.#store) {
      throw new Error('record has been removed from Store');
    }

    return this.#store;
  }

  static get keys(): Dict<KeyDefinition> {
    return this.getPropertiesMeta('key');
  }

  static get attributes(): Dict<AttributeDefinition> {
    return this.getPropertiesMeta('attribute');
  }

  static get relationships(): Dict<RelationshipDefinition> {
    return this.getPropertiesMeta('relationship');
  }

  static getPropertiesMeta(kind: string) {
    const properties = Object.getOwnPropertyNames(this.prototype);
    const meta = {};
    for (let property of properties) {
      if (Reflect.hasMetadata(`orbit:${kind}`, this.prototype, property)) {
        meta[property] = Reflect.getMetadata(
          `orbit:${kind}`,
          this.prototype,
          property
        );
      }
    }
    return meta;
  }

  static create(injections: ModelSettings) {
    const { identity, store, mutableFields, ...otherInjections } = injections;
    const record = new this({ identity, store, mutableFields });
    return Object.assign(record, otherInjections);
  }
}
