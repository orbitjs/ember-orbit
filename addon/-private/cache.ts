import Orbit, {
  buildQuery, RecordIdentity, QueryOrExpression
} from '@orbit/data';
import { deepGet } from '@orbit/utils';
import { Cache as MemoryCache } from '@orbit/store';

import LiveQuery from './live-query';
import IdenityMap from './identity-map';

const { deprecate } = Orbit;

export default class Cache {
  private _sourceCache: MemoryCache;
  private _identityMap: IdenityMap;

  constructor(sourceCache: MemoryCache, identityMap: IdenityMap) {
    this._sourceCache = sourceCache;
    this._identityMap = identityMap;
  }

  includesRecord(type: string, id: string) {
    return !!this.retrieveRecordData(type, id);
  }

  retrieveRecord(type: string, id:string) {
    if (this.includesRecord(type, id)) {
      return this._identityMap.lookup({type, id});
    }
    return null;
  }

  retrieveRecordData(type: string, id: string) {
    return this._sourceCache.getRecordSync({ type, id });
  }

  retrieveKey(identity: RecordIdentity, key: string) {
    const record = this._sourceCache.getRecordSync(identity);
    return deepGet(record, ['keys', key]);
  }

  retrieveAttribute(identity: RecordIdentity, attribute: string) {
    const record = this._sourceCache.getRecordSync(identity);
    return deepGet(record, ['attributes', attribute]);
  }

  retrieveRelatedRecord(identity: RecordIdentity, relationship: string) {
    const record = this._sourceCache.getRecordSync(identity);
    if (record) {
      const identity = deepGet(record, ['relationships', relationship, 'data']);
      if (!identity) {
        return null;
      }

      return this._identityMap.lookup(identity);
    }
    return null;
  }

  unload(record: RecordIdentity) {
    this._identityMap.evict(record);
  }

  query(queryOrExpression: QueryOrExpression, options?: object, id?: string) {
    const query = buildQuery(queryOrExpression, options, id, this._sourceCache.queryBuilder);
    const result = this._sourceCache.query(query);
    return this._identityMap.lookupQueryResult(query, result);
  }

  liveQuery(queryOrExpression: QueryOrExpression, options?: object, id?: string) {
    const query = buildQuery(queryOrExpression, options, id, this._sourceCache.queryBuilder);

    return LiveQuery.create({
      _query: query,
      _sourceCache: this._sourceCache,
      _identityMap: this._identityMap
    });
  }

  find(type: string, id?: string) {
    if (id === undefined) {
      return this.findRecords(type);
    } else {
      return this.findRecord(type, id);
    }
  }

  findAll(type: string, options?: object) {
    deprecate('`Cache.findAll(type)` is deprecated, use `Cache.findRecords(type)`.');
    return this.findRecords(type, options);
  }

  findRecord(type: string, id: string, options?: object) {
    return this.query(q => q.findRecord({ type, id }), options);
  }

  findRecords(type: string, options?: object) {
    return this.query(q => q.findRecords(type), options);
  }
}
