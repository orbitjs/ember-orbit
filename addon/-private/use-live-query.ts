import { getOwner, setOwner } from '@ember/application';
import { tracked } from '@glimmer/tracking';
import { inject as service } from '@ember/service';
import {
  SyncLiveQuery,
  SyncLiveQueryUpdate,
  QueryResult
} from '@orbit/record-cache';
import { QueryOrExpressions, RequestOptions } from '@orbit/data';

import { setUsableManager } from './utils/use';
import Store from '../-private/store';

export interface LiveQuerySettings {
  queryOrExpressions: QueryOrExpressions;
  options?: RequestOptions;
  id?: string;
  store?: Store;
}

export class LiveQueryService {
  @service store!: Store;
  #store!: Store;

  @tracked update?: SyncLiveQueryUpdate;
  #liveQuery?: SyncLiveQuery;

  #unsubscribe?: () => void;

  get state(): QueryResult {
    if (this.update) {
      return this.#store.cache.lookup(this.update.query());
    } else if (this.#liveQuery) {
      return this.#store.cache.lookup(this.#liveQuery.query());
    }
    return null;
  }

  setup(settings: LiveQuerySettings) {
    this.#store = settings.store || this.store;

    if (this.#unsubscribe) {
      this.#unsubscribe();
    }

    this.#liveQuery = this.#store.source.cache.liveQuery(
      settings.queryOrExpressions,
      settings.options,
      settings.id
    );
    this.#unsubscribe = this.#liveQuery.subscribe((update) => {
      this.update = update;
    });
  }

  teardown() {
    if (this.#unsubscribe) {
      this.#unsubscribe();
    }
  }
}

export class LiveQueryManager {
  createUsable(context) {
    const owner = getOwner(context);
    const instance = new LiveQueryService();
    setOwner(instance, owner);

    return instance;
  }

  getState(instance: LiveQueryService) {
    return instance.state;
  }

  setupUsable(instance: LiveQueryService, settings: LiveQuerySettings) {
    instance.setup(settings);
  }

  updateUsable(instance: LiveQueryService, settings: LiveQuerySettings) {
    instance.setup(settings);
  }

  teardownUsable(instance: LiveQueryService) {
    instance.teardown();
  }
}

const MANAGED_LIVE_QUERY = {};
setUsableManager(MANAGED_LIVE_QUERY, () => new LiveQueryManager());

export function useLiveQuery(
  queryOrExpressions: QueryOrExpressions,
  options?: RequestOptions,
  id?: string
): LiveQuerySettings {
  const liveQueryDefinition: LiveQuerySettings = Object.create(
    MANAGED_LIVE_QUERY
  );

  liveQueryDefinition.queryOrExpressions = queryOrExpressions;
  liveQueryDefinition.options = options;
  liveQueryDefinition.id = id;

  if (options && options.store) {
    liveQueryDefinition.store = options.store as Store;
  }

  return liveQueryDefinition;
}
