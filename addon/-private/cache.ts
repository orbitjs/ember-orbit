import { notifyPropertyChange } from '@ember/object';

import { Listener } from '@orbit/core';
import { deepGet } from '@orbit/utils';
import Orbit, {
  buildQuery,
  RecordIdentity,
  QueryOrExpression,
  RecordOperation,
  Record
} from '@orbit/data';
import { QueryResultData } from '@orbit/record-cache';
import { MemoryCache } from '@orbit/memory';
import IdentityMap from '@orbit/identity-map';

import LiveQuery from './live-query';
import Model from './model';
import ModelFactory from './model-factory';
import recordIdentitySerializer from './utils/record-identity-serializer';

const { deprecate } = Orbit;

export interface CacheSettings {
  sourceCache: MemoryCache;
  modelFactory: ModelFactory;
}

interface LiveQueryContract {
  invalidate(): void;
}

export default class Cache {
  private _sourceCache: MemoryCache;
  private _modelFactory: ModelFactory;
  private _identityMap: IdentityMap<RecordIdentity, Model> = new IdentityMap({
    serializer: recordIdentitySerializer
  });
  private _liveQuerySet: Set<LiveQueryContract> = new Set();
  private _patchListener: Listener;
  private _resetListener: Listener;

  constructor(settings: CacheSettings) {
    this._sourceCache = settings.sourceCache;
    this._modelFactory = settings.modelFactory;

    this._patchListener = this.generatePatchListener();
    this._resetListener = this.generateResetListener();

    this._sourceCache.on('patch', this._patchListener);
    this._sourceCache.on('reset', this._resetListener);
  }

  /**
   * @deprecated
   */
  retrieveRecordData(type: string, id: string): Record | undefined {
    deprecate(
      '`Cache#retrieveRecordData(type, id)` is deprecated, use `Cache#peekRecordData(type, id)`.'
    );
    return this.peekRecordData(type, id);
  }

  peekRecordData(type: string, id: string): Record | undefined {
    return this._sourceCache.getRecordSync({ type, id });
  }

  includesRecord(type: string, id: string): boolean {
    return !!this.peekRecordData(type, id);
  }

  /**
   * @deprecated
   */
  retrieveRecord(type: string, id: string): Model | undefined {
    deprecate(
      '`Cache#retrieveRecord(type, id)` is deprecated, use `Cache#peekRecord(type, id)`.'
    );
    return this.peekRecord(type, id);
  }

  peekRecord(type: string, id: string): Model | undefined {
    if (this.includesRecord(type, id)) {
      return this.lookup({ type, id }) as Model;
    }
    return undefined;
  }

  /**
   * @deprecated
   */
  retrieveKey(identity: RecordIdentity, key: string): string | undefined {
    deprecate(
      '`Cache#retrieveKey(identity, key)` is deprecated, use `Cache#peekKey(identity, key)`.'
    );
    return this.peekKey(identity, key);
  }

  peekKey(identity: RecordIdentity, key: string): string | undefined {
    const record = this._sourceCache.getRecordSync(identity);
    return record && deepGet(record, ['keys', key]);
  }

  /**
   * @deprecated
   */
  retrieveAttribute(identity: RecordIdentity, attribute: string): any {
    deprecate(
      '`Cache#retrieveAttribute(identity, attribute)` is deprecated, use `Cache#peekAttribute(identity, key)`.'
    );
    const record = this._sourceCache.getRecordSync(identity);
    return record && deepGet(record, ['attributes', attribute]);
  }

  peekAttribute(identity: RecordIdentity, attribute: string): any {
    const record = this._sourceCache.getRecordSync(identity);
    return record && deepGet(record, ['attributes', attribute]);
  }

  /**
   * @deprecated
   */
  retrieveRelatedRecord(
    identity: RecordIdentity,
    relationship: string
  ): Model | null | undefined {
    deprecate(
      '`Cache#retrieveRelatedRecord(identity, relationship)` is deprecated, use `Cache#peekRelatedRecord(identity, relationship)`.'
    );
    return this.peekRelatedRecord(identity, relationship);
  }

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
  retrieveRelatedRecords(
    identity: RecordIdentity,
    relationship: string
  ): Model[] | undefined {
    deprecate(
      '`Cache#retrieveRelatedRecords(identity, relationship)` is deprecated, use `Cache#peekRelatedRecords(identity, relationship)`.'
    );
    return this.peekRelatedRecords(identity, relationship);
  }

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
    queryOrExpression: QueryOrExpression,
    options?: object,
    id?: string
  ): Model | Model[] | null {
    const query = buildQuery(
      queryOrExpression,
      options,
      id,
      this._sourceCache.queryBuilder
    );
    const result = this._sourceCache.query(query);
    if (result) {
      return this.lookup(result);
    } else {
      return result;
    }
  }

  liveQuery(
    queryOrExpression: QueryOrExpression,
    options?: object,
    id?: string
  ) {
    const query = buildQuery(
      queryOrExpression,
      options,
      id,
      this._sourceCache.queryBuilder
    );

    const liveQuery = LiveQuery.create({
      getContent: () => this.query(query),
      _liveQuerySet: this._liveQuerySet
    });

    this._liveQuerySet.add(liveQuery);

    return liveQuery;
  }

  find(type: string, id?: string): Model | Model[] {
    if (id === undefined) {
      return this.findRecords(type);
    } else {
      return this.findRecord(type, id);
    }
  }

  findAll(type: string, options?: object): Model[] {
    deprecate(
      '`Cache.findAll(type)` is deprecated, use `Cache.findRecords(type)`.'
    );
    return this.findRecords(type, options);
  }

  findRecord(type: string, id: string, options?: object): Model {
    return this.query(q => q.findRecord({ type, id }), options) as Model;
  }

  findRecords(type: string, options?: object): Model[] {
    return this.query(q => q.findRecords(type), options) as Model[];
  }

  unload(identity: RecordIdentity): void {
    const record = this._identityMap.get(identity);
    if (record) {
      record.disconnect();
      this._identityMap.delete(identity);
    }
  }

  lookup(result: QueryResultData): Model | Model[] | null {
    if (Array.isArray(result)) {
      return result.map(identity => this.lookup(identity) as Model);
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

  destroy(): void {
    this._sourceCache.off('patch', this._patchListener);
    this._sourceCache.off('reset', this._resetListener);

    for (let record of this._identityMap.values()) {
      record.disconnect();
    }

    this._identityMap.clear();
    this._liveQuerySet.clear();
  }

  private notifyPropertyChange(
    identity: RecordIdentity,
    property: string
  ): void {
    const record = this._identityMap.get(identity);

    if (record) {
      notifyPropertyChange(record, property);
    }
  }

  private notifyLiveQueryChange(): void {
    for (let liveQuery of this._liveQuerySet) {
      liveQuery.invalidate();
    }
  }

  private generatePatchListener(): (operation: RecordOperation) => void {
    return (operation: RecordOperation) => {
      const record = operation.record as Record;
      const { type, id, keys, attributes, relationships } = record;
      const identity = { type, id };

      this.notifyLiveQueryChange();

      switch (operation.op) {
        case 'updateRecord':
          for (let properties of [attributes, keys, relationships]) {
            if (properties) {
              for (let property of Object.keys(properties)) {
                if (properties.hasOwnProperty(property)) {
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

  private generateResetListener(): () => void {
    return () => this.notifyLiveQueryChange();
  }
}
