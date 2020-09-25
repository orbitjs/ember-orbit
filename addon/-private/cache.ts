import { deepGet } from '@orbit/utils';
import { Orbit } from '@orbit/core';
import {
  buildQuery,
  RecordIdentity,
  QueryOrExpressions,
  RecordOperation,
  Record,
  KeyMap,
  Schema,
  TransformBuilder,
  RequestOptions
} from '@orbit/data';
import { QueryResultData } from '@orbit/record-cache';
import { MemoryCache } from '@orbit/memory';
import IdentityMap from '@orbit/identity-map';
import { registerDestructor } from '@ember/destroyable';

import Model, { QueryResult } from './model';
import LiveQuery from './live-query';
import ModelFactory from './model-factory';
import recordIdentitySerializer from './utils/record-identity-serializer';

const { assert } = Orbit;

export interface CacheSettings {
  sourceCache: MemoryCache;
  modelFactory: ModelFactory;
}

export default class Cache {
  private _sourceCache: MemoryCache;
  private _modelFactory: ModelFactory;
  private _identityMap: IdentityMap<RecordIdentity, Model> = new IdentityMap({
    serializer: recordIdentitySerializer
  });

  constructor(settings: CacheSettings) {
    this._sourceCache = settings.sourceCache;
    this._modelFactory = settings.modelFactory;

    const patchUnbind = this._sourceCache.on(
      'patch',
      this.generatePatchListener()
    );

    registerDestructor(this, () => {
      patchUnbind();
      this._identityMap.clear();
    });
  }

  get keyMap(): KeyMap | undefined {
    return this._sourceCache.keyMap;
  }

  get schema(): Schema {
    return this._sourceCache.schema;
  }

  get transformBuilder(): TransformBuilder {
    return this._sourceCache.transformBuilder;
  }

  /**
   * @deprecated
   */
  peekRecordData(type: string, id: string): Record | undefined {
    return this._sourceCache.getRecordSync({ type, id });
  }

  /**
   * @deprecated
   */
  includesRecord(type: string, id: string): boolean {
    return !!this.peekRecordData(type, id);
  }

  /**
   * @deprecated
   */
  peekRecord(type: string, id: string): Model | undefined {
    if (this.includesRecord(type, id)) {
      return this.lookup({ type, id }) as Model;
    }
    return undefined;
  }

  /**
   * @deprecated
   */
  peekRecords(type: string): Model[] {
    const identities = this._sourceCache.getRecordsSync(type);
    return this.lookup(identities) as Model[];
  }

  peekRecordByKey(
    type: string,
    keyName: string,
    keyValue: string
  ): Model | undefined {
    return this.peekRecord(type, this.recordIdFromKey(type, keyName, keyValue));
  }

  recordIdFromKey(type: string, keyName: string, keyValue: string): string {
    let keyMap = this.keyMap as KeyMap;
    assert(
      'No `keyMap` has been assigned to the Cache, so `recordIdFromKey` can not work.',
      !!keyMap
    );
    let id = keyMap.keyToId(type, keyName, keyValue);
    if (!id) {
      id = this.schema.generateId(type);
      keyMap.pushRecord({ type, id, keys: { [keyName]: keyValue } });
    }
    return id;
  }

  peekKey(identity: RecordIdentity, key: string): string | undefined {
    const record = this._sourceCache.getRecordSync(identity);
    return record && deepGet(record, ['keys', key]);
  }

  peekAttribute(identity: RecordIdentity, attribute: string): any {
    const record = this._sourceCache.getRecordSync(identity);
    return record && deepGet(record, ['attributes', attribute]);
  }

  /**
   * @deprecated
   */
  peekRelatedRecord(
    identity: RecordIdentity,
    relationship: string
  ): Model | null | undefined {
    const relatedRecord = this._sourceCache.getRelatedRecordSync(
      identity,
      relationship
    );
    if (relatedRecord) {
      return this.lookup(relatedRecord) as Model;
    } else {
      return relatedRecord;
    }
  }

  /**
   * @deprecated
   */
  peekRelatedRecords(
    identity: RecordIdentity,
    relationship: string
  ): Model[] | undefined {
    const relatedRecords = this._sourceCache.getRelatedRecordsSync(
      identity,
      relationship
    );
    if (relatedRecords) {
      return this.lookup(relatedRecords) as Model[];
    } else {
      return undefined;
    }
  }

  query(
    queryOrExpressions: QueryOrExpressions,
    options?: RequestOptions,
    id?: string
  ): QueryResult {
    const query = buildQuery(
      queryOrExpressions,
      options,
      id,
      this._sourceCache.queryBuilder
    );
    const result = this._sourceCache.query(query);
    if (result) {
      return this.lookup(result, query.expressions.length);
    } else {
      return result;
    }
  }

  liveQuery(
    queryOrExpressions: QueryOrExpressions,
    options?: RequestOptions,
    id?: string
  ): LiveQuery {
    const query = buildQuery(
      queryOrExpressions,
      options,
      id,
      this._sourceCache.queryBuilder
    );
    const liveQuery = this._sourceCache.liveQuery(query);
    return new LiveQuery({ liveQuery, cache: this, query });
  }

  /**
   * @deprecated
   */
  find(type: string, id?: string): Model | Model[] {
    if (id === undefined) {
      return this.findRecords(type);
    } else {
      return this.findRecord(type, id);
    }
  }

  /**
   * @deprecated
   */
  findRecord(type: string, id: string, options?: RequestOptions): Model {
    return this.query((q) => q.findRecord({ type, id }), options) as Model;
  }

  /**
   * @deprecated
   */
  findRecords(type: string, options?: RequestOptions): Model[] {
    return this.query((q) => q.findRecords(type), options) as Model[];
  }

  unload(identity: RecordIdentity): void {
    const record = this._identityMap.get(identity);
    if (record) {
      record.disconnect();
      this._identityMap.delete(identity);
    }
  }

  lookup(
    result: QueryResult<Record>,
    expressions = 1
  ): Model | Model[] | null | (Model | Model[] | null)[] {
    if (isQueryResultData(result, expressions)) {
      return (result as QueryResultData[]).map((result) =>
        this._lookup(result)
      );
    } else {
      return this._lookup(result);
    }
  }

  private _lookup(result: QueryResultData): Model | Model[] | null {
    if (Array.isArray(result)) {
      return result.map((identity) => this._lookup(identity) as Model);
    } else if (result) {
      let record = this._identityMap.get(result);

      if (!record) {
        record = this._modelFactory.create(result);
        this._identityMap.set(result, record);
      }

      return record;
    }

    return null;
  }

  private notifyPropertyChange(
    identity: RecordIdentity,
    property: string
  ): void {
    const record = this._identityMap.get(identity);

    if (record) {
      record.notifyPropertyChange(property);
    }
  }

  private generatePatchListener(): (operation: RecordOperation) => void {
    return (operation: RecordOperation) => {
      const record = operation.record as Record;
      const { type, id, keys, attributes, relationships } = record;
      const identity = { type, id };

      switch (operation.op) {
        case 'updateRecord':
          for (let properties of [attributes, keys, relationships]) {
            if (properties) {
              for (let property of Object.keys(properties)) {
                if (
                  Object.prototype.hasOwnProperty.call(properties, property)
                ) {
                  this.notifyPropertyChange(identity, property);
                }
              }
            }
          }
          break;
        case 'replaceAttribute':
          this.notifyPropertyChange(identity, operation.attribute);
          break;
        case 'replaceKey':
          this.notifyPropertyChange(identity, operation.key);
          break;
        case 'replaceRelatedRecord':
        case 'replaceRelatedRecords':
        case 'addToRelatedRecords':
        case 'removeFromRelatedRecords':
          this.notifyPropertyChange(identity, operation.relationship);
          break;
        case 'removeRecord':
          this.unload(identity);
          break;
      }
    };
  }
}

function isQueryResultData(
  _result: QueryResult<Record>,
  expressions: number
): _result is QueryResultData[] {
  return expressions > 1;
}
