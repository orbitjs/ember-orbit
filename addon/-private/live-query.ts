import Helper from '@ember/component/helper';
import { tracked } from '@glimmer/tracking';
import { inject as service } from '@ember/service';
import { QueryOrExpressions, RequestOptions } from '@orbit/data';
import {
  SyncLiveQuery,
  SyncLiveQueryUpdate,
  QueryResult
} from '@orbit/record-cache';

import Store from '../-private/store';

export class LiveQuery extends Helper {
  @service store!: Store;
  #store!: Store;

  @tracked update?: SyncLiveQueryUpdate;
  #liveQuery?: SyncLiveQuery;

  #unsubscribe?: () => void;

  #queryOrExpressions?: QueryOrExpressions;
  #options?: RequestOptions;
  #id?: string;

  get data(): QueryResult {
    if (this.update) {
      return this.#store.cache.lookup(this.update.query());
    } else if (this.#liveQuery) {
      return this.#store.cache.lookup(this.#liveQuery.query());
    }
    return null;
  }

  compute(
    [queryOrExpressions, options, id]: [
      QueryOrExpressions,
      RequestOptions | undefined,
      string | undefined
    ],
    { store }: { store?: Store }
  ): QueryResult {
    if (
      this.#queryOrExpressions !== queryOrExpressions ||
      this.#options !== options ||
      this.#id !== id ||
      this.#store !== (store || this.store)
    ) {
      this.#store = store || this.store;
      this.#queryOrExpressions = queryOrExpressions;
      this.#options = options;
      this.#id = id;

      this.#liveQuery = this.#store.source.cache.liveQuery(
        queryOrExpressions,
        options,
        id
      );

      if (this.#unsubscribe) {
        this.#unsubscribe();
      }

      this.#unsubscribe = this.#liveQuery.subscribe((update) => {
        this.update = update;
      });
    }

    return this.data;
  }

  willDestroy() {
    if (this.#unsubscribe) {
      this.#unsubscribe();
    }
  }
}
