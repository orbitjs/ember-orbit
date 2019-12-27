import EmberObject from '@ember/object';
import Orbit from '@orbit/core';
import { Dict } from '@orbit/utils';
import {
  Record,
  RecordIdentity,
  KeyDefinition,
  AttributeDefinition,
  RelationshipDefinition
} from '@orbit/data';

const { deprecate } = Orbit;

import { HasOneRelation, HasManyRelation } from './relations';
import Store from './store';

export interface ModelSettings {
  identity: RecordIdentity;
}

export default class Model extends EmberObject {
  identity!: RecordIdentity;

  private _store?: Store;
  private _hasManyRelations: Dict<HasManyRelation> = {};
  private _hasOneRelations: Dict<HasOneRelation> = {};

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
    field: string,
    value: string,
    options?: object
  ): Promise<void> {
    await this.store.update(
      t => t.replaceKey(this.identity, field, value),
      options
    );
  }

  hasMany(name: string): HasManyRelation {
    let relationship = this._hasManyRelations[name];
    if (!relationship) {
      this._hasManyRelations[name] = relationship = new HasManyRelation(
        this,
        name
      );
    }
    return relationship;
  }

  hasOne(name: string): HasOneRelation {
    let relationship = this._hasOneRelations[name];
    if (!relationship) {
      this._hasOneRelations[name] = relationship = new HasOneRelation(
        this,
        name
      );
    }
    return relationship;
  }

  getAttribute(field: string): any {
    return this.store.cache.peekAttribute(this.identity, field);
  }

  async replaceAttribute(
    attribute: string,
    value: unknown,
    options?: object
  ): Promise<void> {
    await this.store.update(
      t => t.replaceAttribute(this.identity, attribute, value),
      options
    );
  }

  /**
   * @deprecated
   */
  getRelatedRecord(relationship: string): Record | null {
    deprecate(
      '`Model#getRelatedRecord(relationship)` is deprecated, use `Model#hasOne(relationship).value`.'
    );
    return this.hasOne(relationship).value;
  }

  /**
   * @deprecated
   */
  async replaceRelatedRecord(
    relationship: string,
    record: RecordIdentity | null,
    options?: object
  ): Promise<void> {
    deprecate(
      '`Model#replaceRelatedRecord(relationship, record)` is deprecated, use `Model#hasOne(relationship).replace(record)`.'
    );
    await this.hasOne(relationship).replace(record, options);
  }

  /**
   * @deprecated
   */
  async addToRelatedRecords(
    relationship: string,
    record: RecordIdentity,
    options?: object
  ): Promise<void> {
    deprecate(
      '`Model#addToRelatedRecords(relationship, record)` is deprecated, use `Model#hasMany(relationship).add(record)`.'
    );
    await this.hasMany(relationship).add(record, options);
  }

  /**
   * @deprecated
   */
  async removeFromRelatedRecords(
    relationship: string,
    record: RecordIdentity,
    options?: object
  ): Promise<void> {
    deprecate(
      '`Model#removeFromRelatedRecords(relationship, record)` is deprecated, use `Model#hasMany(relationship).remove(record)`.'
    );
    await this.hasMany(relationship).remove(record, options);
  }

  /**
   * @deprecated
   */
  async replaceAttributes(
    properties: Dict<unknown> = {},
    options?: object
  ): Promise<void> {
    deprecate(
      '`Model#replaceAttributes(properties)` is deprecated, use `Model#update(properties)`.'
    );
    await this.update(properties, options);
  }

  async update(
    properties: Dict<unknown> = {},
    options?: object
  ): Promise<void> {
    await this.store.updateRecord({ ...properties, ...this.identity }, options);
  }

  async remove(options?: object): Promise<void> {
    await this.store.removeRecord(this.identity, options);
  }

  disconnect(): void {
    this._store = undefined;
  }

  willDestroy(): void {
    const cache = this.store.cache;
    if (cache) {
      cache.unload(this);
    }
  }

  get store(): Store {
    if (!this._store) {
      throw new Error('record has been removed from Store');
    }

    return this._store;
  }

  static get keys(): Dict<KeyDefinition> {
    const map: Dict<KeyDefinition> = {};

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

  static get attributes(): Dict<AttributeDefinition> {
    const map: Dict<AttributeDefinition> = {};

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

  static get relationships(): Dict<RelationshipDefinition> {
    const map: Dict<RelationshipDefinition> = {};

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
