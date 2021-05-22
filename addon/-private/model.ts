import { Orbit } from '@orbit/core';
import { Dict } from '@orbit/utils';
import { DefaultRequestOptions, RequestOptions } from '@orbit/data';
import {
  Record,
  RecordIdentity,
  KeyDefinition,
  AttributeDefinition,
  RelationshipDefinition
} from '@orbit/records';
import {
  destroy,
  associateDestroyableChild,
  registerDestructor
} from '@ember/destroyable';
import { DEBUG } from '@glimmer/env';
import { tracked } from '@glimmer/tracking';

import Store from './store';
import { getModelDefinition } from './utils/model-definition';
import { notifyPropertyChange } from './utils/property-cache';

const { assert } = Orbit;

export interface ModelSettings {
  identity: RecordIdentity;
  store: Store;
  mutableFields: boolean;
}
export default class Model {
  readonly identity!: RecordIdentity;

  @tracked protected _store?: Store;
  #mutableFields: boolean;

  constructor(settings: ModelSettings) {
    this.identity = settings.identity;
    this._store = settings.store;
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
    return !this._store;
  }

  getData(): Record | undefined {
    return this.store.cache.peekRecordData(this.type, this.id);
  }

  getKey(field: string): string | undefined {
    return this.store.cache.peekKey(this.identity, field);
  }

  async replaceKey(
    key: string,
    value: string,
    options?: DefaultRequestOptions<RequestOptions>
  ): Promise<void> {
    await this.store.update(
      (t) => t.replaceKey(this.identity, key, value),
      options
    );
  }

  getAttribute(attribute: string): any {
    return this.store.cache.peekAttribute(this.identity, attribute);
  }

  async replaceAttribute(
    attribute: string,
    value: unknown,
    options?: DefaultRequestOptions<RequestOptions>
  ): Promise<void> {
    await this.store.update(
      (t) => t.replaceAttribute(this.identity, attribute, value),
      options
    );
  }

  getRelatedRecord(relationship: string): Model | null | undefined {
    return this.store.cache.peekRelatedRecord(this.identity, relationship);
  }

  async replaceRelatedRecord(
    relationship: string,
    relatedRecord: Model | null,
    options?: DefaultRequestOptions<RequestOptions>
  ): Promise<void> {
    await this.store.update(
      (t) =>
        t.replaceRelatedRecord(
          this.identity,
          relationship,
          relatedRecord ? relatedRecord.identity : null
        ),
      options
    );
  }

  getRelatedRecords(relationship: string): ReadonlyArray<Model> | undefined {
    const records = this.store.cache.peekRelatedRecords(
      this.identity,
      relationship
    );

    if (DEBUG) {
      return Object.freeze(records);
    }

    return records;
  }

  async addToRelatedRecords(
    relationship: string,
    record: Model,
    options?: DefaultRequestOptions<RequestOptions>
  ): Promise<void> {
    await this.store.update(
      (t) =>
        t.addToRelatedRecords(this.identity, relationship, record.identity),
      options
    );
  }

  async removeFromRelatedRecords(
    relationship: string,
    record: Model,
    options?: DefaultRequestOptions<RequestOptions>
  ): Promise<void> {
    await this.store.update(
      (t) =>
        t.removeFromRelatedRecords(
          this.identity,
          relationship,
          record.identity
        ),
      options
    );
  }

  async replaceAttributes(
    properties: Dict<unknown> = {},
    options?: DefaultRequestOptions<RequestOptions>
  ): Promise<void> {
    const keys = Object.keys(properties);
    await this.store
      .update(
        (t) =>
          keys.map((key) =>
            t.replaceAttribute(this.identity, key, properties[key])
          ),
        options
      )
      .then(() => this);
  }

  async update(
    properties: Dict<unknown> = {},
    options?: DefaultRequestOptions<RequestOptions>
  ): Promise<void> {
    await this.store.updateRecord({ ...properties, ...this.identity }, options);
  }

  async remove(options?: DefaultRequestOptions<RequestOptions>): Promise<void> {
    await this.store.removeRecord(this.identity, options);
  }

  disconnect(): void {
    this._store = undefined;
  }

  destroy(): void {
    destroy(this);
  }

  notifyPropertyChange(key: string) {
    notifyPropertyChange(this, key);
  }

  assertMutableFields(): void {
    assert(
      `You tried to directly mutate fields on the '${this.type}:${this.id}' record, which is not allowed on a store that is not a fork. Either make this change using an async method like 'update' or 'replaceAttribute' or fork the store if you need to directly mutate fields on a record.`,
      this.#mutableFields
    );
  }

  protected get store(): Store {
    if (!this._store) {
      throw new Error('record has been removed from Store');
    }

    return this._store;
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
