import type Cache from './cache.ts';
import type Model from './model.ts';
import type { SyncLiveQuery } from '@orbit/record-cache';
import type { RecordQuery, RecordQueryResult } from '@orbit/records';
export interface LiveQuerySettings {
    liveQuery: SyncLiveQuery;
    query: RecordQuery;
    cache: Cache;
}
export default class LiveQuery implements Iterable<Model> {
    #private;
    _invalidate: number;
    constructor(settings: LiveQuerySettings);
    get query(): RecordQuery;
    /**
     * @deprecated
     */
    get content(): RecordQueryResult<Model>;
    get value(): RecordQueryResult<Model>;
    get length(): number;
    [Symbol.iterator](): IterableIterator<Model>;
    destroy(): void;
}
//# sourceMappingURL=live-query.d.ts.map