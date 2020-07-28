import Orbit from '@orbit/core';
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
} from 'ember-destroyable-polyfill';
import { DEBUG } from '@glimmer/env';

import Store from './store';

const { assert } = Orbit;

export interface ModelSettings {
  identity: RecordIdentity;
  store: Store;
  mutable: boolean;
}

export type QueryResult<T = Model> = T | T[] | null | (T | T[] | null)[];

export default class Model {
  readonly identity!: RecordIdentity;

  #store?: Store;
  #mutable: boolean;

  constructor(settings: ModelSettings) {
    this.identity = settings.identity;
    this.#store = settings.store;
    this.#mutable = settings.mutable;
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
    return this.store.cache.peekRecordData(this.type, this.id);
  }

  getKey(field: string): string | undefined {
    return this.store.cache.peekKey(this.identity, field);
  }

  async replaceKey(
    key: string,
    value: string,
    options?: RequestOptions
  ): Promise<void> {
    this.assertMutable();
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
    options?: RequestOptions
  ): Promise<void> {
    this.assertMutable();
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
    options?: RequestOptions
  ): Promise<void> {
    this.assertMutable();
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
    options?: RequestOptions
  ): Promise<void> {
    this.assertMutable();
    await this.store.update(
      (t) =>
        t.addToRelatedRecords(this.identity, relationship, record.identity),
      options
    );
  }

  async removeFromRelatedRecords(
    relationship: string,
    record: Model,
    options?: RequestOptions
  ): Promise<void> {
    this.assertMutable();
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
    options?: RequestOptions
  ): Promise<void> {
    this.assertMutable();
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
    options?: RequestOptions
  ): Promise<void> {
    this.assertMutable();
    await this.store.updateRecord({ ...properties, ...this.identity }, options);
  }

  async remove(options?: RequestOptions): Promise<void> {
    this.assertMutable();
    await this.store.removeRecord(this.identity, options);
  }

  disconnect(): void {
    this.#store = undefined;
  }

  destroy(): void {
    destroy(this);
  }

  private get store(): Store {
    if (!this.#store) {
      throw new Error('record has been removed from Store');
    }

    return this.#store;
  }

  private assertMutable(): void {
    assert(
      `You tried to change ${this.type}:${this.id} record but it is part of a readonly store. Fork the store to make changes.`,
      this.#mutable
    );
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
    const { identity, store, mutable, ...otherInjections } = injections;
    const record = new this({ identity, store, mutable });
    return Object.assign(record, otherInjections);
  }
}
