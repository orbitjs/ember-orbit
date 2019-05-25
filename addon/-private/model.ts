import EmberObject from '@ember/object';

import {
  RecordIdentity,
  KeyDefinition,
  AttributeDefinition,
  RelationshipDefinition
} from '@orbit/data';

import HasMany from './relationships/has-many';
import Store from './store';

export interface ModelSettings {
  identity: RecordIdentity;
}

interface HasManyContract {
  invalidate(): void;
}

export default class Model extends EmberObject {
  identity: RecordIdentity;

  private _store?: Store;
  private _relatedRecords: Record<string, HasManyContract> = {};

  constructor(settings: ModelSettings) {
    super(...arguments);
    this.identity = settings.identity;
  }

  get id() {
    return this.identity.id;
  }

  get type() {
    return this.identity.type;
  }

  get disconnected() {
    return !this._store;
  }

  getKey(field: string) {
    return this.store.cache.retrieveKey(this.identity, field);
  }

  replaceKey(field: string, value: string, options?: object) {
    this.store.update(t => t.replaceKey(this.identity, field, value), options);
  }

  getAttribute(field: string) {
    return this.store.cache.retrieveAttribute(this.identity, field);
  }

  replaceAttribute(attribute: string, value: unknown, options?: object) {
    this.store.update(
      t => t.replaceAttribute(this.identity, attribute, value),
      options
    );
  }

  getData() {
    return this.store.cache.retrieveRecordData(this.type, this.id);
  }

  getRelatedRecord(relationship: string) {
    return this.store.cache.retrieveRelatedRecord(this.identity, relationship);
  }

  replaceRelatedRecord(
    relationship: string,
    relatedRecord?: Model,
    options?: object
  ) {
    this.store.update(
      t =>
        t.replaceRelatedRecord(
          this.identity,
          relationship,
          relatedRecord ? relatedRecord.identity : null
        ),
      options
    );
  }

  getRelatedRecords(relationship: string) {
    this._relatedRecords = this._relatedRecords || {};

    if (!this._relatedRecords[relationship]) {
      this._relatedRecords[relationship] = HasMany.create({
        getContent: () =>
          this.store.cache.retrieveRelatedRecords(this.identity, relationship),
        addToContent: (record: Model): Promise<void> => {
          return this.addToRelatedRecords(relationship, record);
        },
        removeFromContent: (record: Model): Promise<void> => {
          return this.removeFromRelatedRecords(relationship, record);
        }
      });
    }
    this._relatedRecords[relationship].invalidate();

    return this._relatedRecords[relationship];
  }

  addToRelatedRecords(relationship: string, record: Model, options?: object) {
    return this.store.update(
      t => t.addToRelatedRecords(this.identity, relationship, record.identity),
      options
    );
  }

  removeFromRelatedRecords(
    relationship: string,
    record: Model,
    options?: object
  ) {
    return this.store.update(
      t =>
        t.removeFromRelatedRecords(
          this.identity,
          relationship,
          record.identity
        ),
      options
    );
  }

  replaceAttributes(
    properties: Record<string, unknown> = {},
    options?: object
  ) {
    const keys = Object.keys(properties);
    return this.store
      .update(
        t =>
          keys.map(key =>
            t.replaceAttribute(this.identity, key, properties[key])
          ),
        options
      )
      .then(() => this);
  }

  update(properties: Record<string, unknown> = {}, options?: object) {
    return this.store.updateRecord(
      { ...properties, ...this.identity },
      options
    );
  }

  remove(options?: object) {
    return this.store.removeRecord(this.identity, options);
  }

  disconnect() {
    this._store = undefined;
  }

  willDestroy() {
    const cache = this.store.cache;
    if (cache) {
      cache.unload(this);
    }
  }

  private get store() {
    if (!this._store) {
      throw new Error('record has been removed from Store');
    }

    return this._store;
  }

  static get keys() {
    const map: Record<string, KeyDefinition> = {};

    this.eachComputedProperty((name, meta) => {
      if (meta.isKey) {
        meta.name = name;
        map[name] = {
          primaryKey: meta.options.primaryKey
        };
      }
    }, {});

    return map;
  }

  static get attributes() {
    const map: Record<string, AttributeDefinition> = {};

    this.eachComputedProperty((name, meta) => {
      if (meta.isAttribute) {
        meta.name = name;
        map[name] = {
          type: meta.options.type
        };
      }
    }, {});

    return map;
  }

  static get relationships() {
    const map: Record<string, RelationshipDefinition> = {};

    this.eachComputedProperty((name, meta) => {
      if (meta.isRelationship) {
        meta.name = name;
        map[name] = {
          type: meta.options.kind,
          model: meta.options.type,
          inverse: meta.options.inverse,
          dependent: meta.options.dependent
        };
      }
    }, {});

    return map;
  }
}
