import { notifyPropertyChange } from '@ember/object';

import { Listener } from '@orbit/core';
import { deepGet } from '@orbit/utils';
import Orbit, {
  buildQuery,
  RecordIdentity,
  QueryOrExpression,
  RecordOperation,
  Record as OrbitRecord
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

  retrieveRecordData(type: string, id: string) {
    return this._sourceCache.getRecordSync({ type, id });
  }

  includesRecord(type: string, id: string) {
    return !!this.retrieveRecordData(type, id);
  }

  retrieveRecord(type: string, id: string) {
    if (this.includesRecord(type, id)) {
      return this.lookup({ type, id });
    }
    return null;
  }

  retrieveKey(identity: RecordIdentity, key: string) {
    const record = this._sourceCache.getRecordSync(identity);
    return deepGet(record, ['keys', key]);
  }

  retrieveAttribute(identity: RecordIdentity, attribute: string) {
    const record = this._sourceCache.getRecordSync(identity);
    return deepGet(record, ['attributes', attribute]);
  }

  retrieveRelatedRecord(
    identity: RecordIdentity,
    relationship: string
  ): Model | null {
    const record = this._sourceCache.getRecordSync(identity);
    if (record) {
      const identity = deepGet(record, ['relationships', relationship, 'data']);
      if (!identity) {
        return null;
      }

      return this.lookup(identity) as Model | null;
    }
    return null;
  }

  retrieveRelatedRecords(
    identity: RecordIdentity,
    relationship: string
  ): Model[] {
    const query = this._sourceCache.queryBuilder.findRelatedRecords(
      identity,
      relationship
    );
    return this.query(query) as Model[];
  }

  query(queryOrExpression: QueryOrExpression, options?: object, id?: string) {
    const query = buildQuery(
      queryOrExpression,
      options,
      id,
      this._sourceCache.queryBuilder
    );
    const result = this._sourceCache.query(query);
    return this.lookup(result);
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

  find(type: string, id?: string) {
    if (id === undefined) {
      return this.findRecords(type);
    } else {
      return this.findRecord(type, id);
    }
  }

  findAll(type: string, options?: object) {
    deprecate(
      '`Cache.findAll(type)` is deprecated, use `Cache.findRecords(type)`.'
    );
    return this.findRecords(type, options);
  }

  findRecord(type: string, id: string, options?: object) {
    return this.query(q => q.findRecord({ type, id }), options);
  }

  findRecords(type: string, options?: object) {
    return this.query(q => q.findRecords(type), options);
  }

  unload(identity: RecordIdentity) {
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

  destroy() {
    this._sourceCache.off('patch', this._patchListener);
    this._sourceCache.off('reset', this._resetListener);

    for (let record of this._identityMap.values()) {
      record.disconnect();
    }

    this._identityMap.clear();
    this._liveQuerySet.clear();
  }

  private notifyPropertyChange(identity: RecordIdentity, property: string) {
    const record = this._identityMap.get(identity);

    if (record) {
      notifyPropertyChange(record, property);
    }
  }

  private notifyLiveQueryChange() {
    for (let liveQuery of this._liveQuerySet) {
      liveQuery.invalidate();
    }
  }

  private generatePatchListener() {
    return (operation: RecordOperation) => {
      const record = operation.record as OrbitRecord;
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

  private generateResetListener() {
    return () => this.notifyLiveQueryChange();
  }
}
