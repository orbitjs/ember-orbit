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

import HasMany from './relationships/has-many';
import Store from './store';

export interface ModelSettings {
  identity: RecordIdentity;
}

interface HasManyContract {
  invalidate(): void;
}

export interface ModelInjections {
  identity: RecordIdentity;
  _store: Store;
}

export default class Model {
  static _notifiers: Dict<(instance: Model) => void> = {};

  readonly identity!: RecordIdentity;

  #store?: Store;
  #relatedRecords: Dict<HasManyContract> = {};

  constructor(identity: RecordIdentity, store: Store) {
    this.identity = identity;
    this.#store = store;
    associateDestroyableChild(store, this);
    registerDestructor(this, (record) => store.cache.unload(record));
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
    field: string,
    value: string,
    options?: RequestOptions
  ): Promise<void> {
    await this.store.update(
      (t) => t.replaceKey(this.identity, field, value),
      options
    );
  }

  getAttribute(field: string): any {
    return this.store.cache.peekAttribute(this.identity, field);
  }

  async replaceAttribute(
    attribute: string,
    value: unknown,
    options?: RequestOptions
  ): Promise<void> {
    await this.store.update(
      (t) => t.replaceAttribute(this.identity, attribute, value),
      options
    );
  }

  getRelatedRecord(relationship: string): Record | null | undefined {
    return this.store.cache.peekRelatedRecord(this.identity, relationship);
  }

  async replaceRelatedRecord(
    relationship: string,
    relatedRecord: Model | null,
    options?: RequestOptions
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

  getRelatedRecords(relationship: string) {
    this.#relatedRecords = this.#relatedRecords || {};

    if (!this.#relatedRecords[relationship]) {
      this.#relatedRecords[relationship] = HasMany.create({
        getContent: () =>
          this.store.cache.peekRelatedRecords(this.identity, relationship),
        addToContent: (record: Model): Promise<void> => {
          return this.addToRelatedRecords(relationship, record);
        },
        removeFromContent: (record: Model): Promise<void> => {
          return this.removeFromRelatedRecords(relationship, record);
        }
      });
    }
    this.#relatedRecords[relationship].invalidate();

    return this.#relatedRecords[relationship];
  }

  async addToRelatedRecords(
    relationship: string,
    record: Model,
    options?: RequestOptions
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
    options?: RequestOptions
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
    options?: RequestOptions
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
    options?: RequestOptions
  ): Promise<void> {
    await this.store.updateRecord({ ...properties, ...this.identity }, options);
  }

  async remove(options?: RequestOptions): Promise<void> {
    await this.store.removeRecord(this.identity, options);
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

  static create(injections: ModelInjections) {
    const { identity, _store, ..._injections } = injections;
    const record = new this(identity, _store);
    return Object.assign(record, _injections);
  }
}
