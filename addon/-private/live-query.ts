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

// import { createCache, getValue } from '@glimmer/tracking/primitives/cache';
import { createCache, getValue } from './utils/glimmer-cache';

import Cache from './cache';
import { QueryResult } from './model';
import { Model } from 'ember-orbit';

const { assert, deprecate } = Orbit;

export interface LiveQuerySettings {
  liveQuery: SyncLiveQuery;
  query: Query;
  cache: Cache;
}

export default class LiveQuery implements Iterable<Model> {
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

  get value(): QueryResult {
    return getValue(this.#value);
  }

  [Symbol.iterator](): IterableIterator<Model> {
    assert(
      'LiveQuery result is not a collection. You can access it result as `liveQuery.value`.',
      Array.isArray(this.value)
    );
    deprecate(
      'Using LiveQuery as an iterable is deprecated. Use `liveQuery.value` instead.'
    );

    this.#iteratorAccessed = true;
    return (this.value as Model[])[Symbol.iterator]();
  }

  destroy() {
    destroy(this);
  }
}
