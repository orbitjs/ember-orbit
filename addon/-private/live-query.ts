import { Orbit } from '@orbit/core';
import { tracked } from '@glimmer/tracking';
import { notifyPropertyChange } from '@ember/object';
import { SyncLiveQuery } from '@orbit/record-cache';
import { Query, RecordNotFoundException } from '@orbit/data';
import {
  registerDestructor,
  associateDestroyableChild,
  destroy
} from '@ember/destroyable';
import { createCache, getValue } from '@glimmer/tracking/primitives/cache';

import Cache from './cache';
import { QueryResult } from './model';
import { Model } from 'ember-orbit';

const { assert } = Orbit;

export interface LiveQuerySettings {
  liveQuery: SyncLiveQuery;
  query: Query;
  cache: Cache;
}

export default class LiveQuery<T extends Model = Model> implements Iterable<T> {
  #query: Query;
  #cache: Cache;

  #iteratorAccessed = false;

  #value = createCache(() => {
    this._invalidate;
    try {
      return this.#cache.query(this.#query);
    } catch (e) {
      if (e instanceof RecordNotFoundException) {
        return undefined;
      }
      throw e;
    }
  });

  @tracked _invalidate = 0;

  constructor(settings: LiveQuerySettings) {
    this.#query = settings.query;
    this.#cache = settings.cache;

    const unsubscribe = settings.liveQuery.subscribe(() => {
      this._invalidate++;
      if (this.#iteratorAccessed) {
        notifyPropertyChange(this, '[]');
      }
    });
    registerDestructor(this, unsubscribe);
    associateDestroyableChild(this.#cache, this);
  }

  get value(): QueryResult<T> {
    return getValue(this.#value);
  }

  get length(): number {
    return (this.value as Model[]).length;
  }

  [Symbol.iterator](): IterableIterator<T> {
    assert(
      'LiveQuery result is not a collection. You can access the result as `liveQuery.value`.',
      Array.isArray(this.value)
    );

    this.#iteratorAccessed = true;
    return (this.value as T[])[Symbol.iterator]();
  }

  destroy() {
    destroy(this);
  }
}
