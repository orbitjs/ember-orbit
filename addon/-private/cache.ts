import { deepGet } from '@orbit/utils';
import Orbit, {
  buildQuery,
  RecordIdentity,
  QueryOrExpressions,
  Record,
  KeyMap,
  Schema,
  TransformBuilder,
  RequestOptions
} from '@orbit/data';
import { MemoryCache } from '@orbit/memory';

import Model, { QueryResult } from './model';
import LiveQuery from './live-query';
import IdentityMap from './identity-map';

const { assert } = Orbit;

export interface CacheSettings {
  cache: MemoryCache;
  identityMap: IdentityMap;
}

export default class Cache {
  #cache: MemoryCache;
  #identityMap: IdentityMap;

  constructor(settings: CacheSettings) {
    this.#cache = settings.cache;
    this.#identityMap = settings.identityMap;
  }

  get keyMap(): KeyMap | undefined {
    return this.#cache.keyMap;
  }

  get schema(): Schema {
    return this.#cache.schema;
  }

  get transformBuilder(): TransformBuilder {
    return this.#cache.transformBuilder;
  }

  peekRecordData(type: string, id: string): Record | undefined {
    return this.#cache.getRecordSync({ type, id });
  }

  includesRecord(type: string, id: string): boolean {
    return !!this.peekRecordData(type, id);
  }

  peekRecord(type: string, id: string): Model | undefined {
    if (this.includesRecord(type, id)) {
      return this.#identityMap.lookup({ type, id }) as Model;
    }
    return undefined;
  }

  peekRecords(type: string): Model[] {
    const identities = this.#cache.getRecordsSync(type);
    return this.#identityMap.lookup(identities) as Model[];
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
    const record = this.#cache.getRecordSync(identity);
    return record && deepGet(record, ['keys', key]);
  }

  peekAttribute(identity: RecordIdentity, attribute: string): any {
    const record = this.#cache.getRecordSync(identity);
    return record && deepGet(record, ['attributes', attribute]);
  }

  peekRelatedRecord(
    identity: RecordIdentity,
    relationship: string
  ): Model | null | undefined {
    const relatedRecord = this.#cache.getRelatedRecordSync(
      identity,
      relationship
    );
    if (relatedRecord) {
      return this.#identityMap.lookup(relatedRecord) as Model;
    } else {
      return relatedRecord;
    }
  }

  peekRelatedRecords(
    identity: RecordIdentity,
    relationship: string
  ): Model[] | undefined {
    const relatedRecords = this.#cache.getRelatedRecordsSync(
      identity,
      relationship
    );
    if (relatedRecords) {
      return this.#identityMap.lookup(relatedRecords) as Model[];
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
      this.#cache.queryBuilder
    );
    const result = this.#cache.query(query);
    if (result) {
      return this.#identityMap.lookup(result, query.expressions.length);
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
      this.#cache.queryBuilder
    );
    const liveQuery = this.#cache.liveQuery(query);
    return new LiveQuery({ liveQuery, identityMap: this.#identityMap, query });
  }

  find(type: string, id?: string): Model | Model[] {
    if (id === undefined) {
      return this.findRecords(type);
    } else {
      return this.findRecord(type, id);
    }
  }

  findRecord(type: string, id: string, options?: RequestOptions): Model {
    return this.query((q) => q.findRecord({ type, id }), options) as Model;
  }

  findRecords(type: string, options?: RequestOptions): Model[] {
    return this.query((q) => q.findRecords(type), options) as Model[];
  }

  unload(identity: RecordIdentity): void {
    this.#identityMap.unload(identity);
  }
}
