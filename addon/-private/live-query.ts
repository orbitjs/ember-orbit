import { Orbit } from '@orbit/core';
import { tracked } from '@glimmer/tracking';
import { notifyPropertyChange } from '@ember/object';
import { SyncLiveQuery } from '@orbit/record-cache';
import { RecordQuery, RecordQueryResult } from '@orbit/records';
import {
  registerDestructor,
  associateDestroyableChild,
  destroy
} from '@ember/destroyable';
import { createCache, getValue } from '@glimmer/tracking/primitives/cache';

import Cache from './cache';
import { Model } from 'ember-orbit';

const { assert, deprecate } = Orbit;

export interface LiveQuerySettings {
  liveQuery: SyncLiveQuery;
  query: RecordQuery;
  cache: Cache;
}

export default class LiveQuery implements Iterable<Model> {
  #query: RecordQuery;
  #cache: Cache;

  #iteratorAccessed = false;

  #value = createCache(() => {
    this._invalidate;
    return this.#cache.query(this.#query);
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

  get query(): RecordQuery {
    return this.#query;
  }

  /**
   * @deprecated
   */
  get content(): RecordQueryResult<Model> {
    deprecate(
      'LiveQuery#content is deprecated. Access LiveQuery#value instead.'
    );
    return this.value;
  }

  get value(): RecordQueryResult<Model> {
    return getValue(this.#value);
  }

  get length(): number {
    return (this.value as Model[]).length;
  }

  [Symbol.iterator](): IterableIterator<Model> {
    assert(
      'LiveQuery result is not a collection. You can access the result as `liveQuery.value`.',
      Array.isArray(this.value)
    );

    this.#iteratorAccessed = true;
    return (this.value as Model[])[Symbol.iterator]();
  }

  destroy() {
    destroy(this);
  }
}
