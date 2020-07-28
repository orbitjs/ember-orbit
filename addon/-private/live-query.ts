import Orbit from '@orbit/core';
import { tracked } from '@glimmer/tracking';
import { notifyPropertyChange } from '@ember/object';

import { SyncLiveQuery } from '@orbit/record-cache';
import { Query, RecordNotFoundException } from '@orbit/data';
import {
  registerDestructor,
  associateDestroyableChild,
  destroy
} from 'ember-destroyable-polyfill';

// import { createCache, getValue } from '@glimmer/tracking/primitives/cache';
import { createCache, getValue } from './utils/glimmer-cache';

import Model, { QueryResult } from './model';
import IdentityMap from './identity-map';

const { assert, deprecate } = Orbit;

export interface LiveQuerySettings {
  liveQuery: SyncLiveQuery;
  identityMap: IdentityMap;
  query: Query;
}

export default class LiveQuery implements Iterable<Model> {
  #identityMap: IdentityMap;
  #liveQuery: SyncLiveQuery;
  #query: Query;

  #iteratorAccessed = false;

  #value = createCache(() => {
    this._invalidate;
    try {
      const result = this.#liveQuery.query();
      return this.#identityMap.lookup(result, this.#query.expressions.length);
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
    this.#identityMap = settings.identityMap;
    this.#liveQuery = settings.liveQuery;

    const unsubscribe = settings.liveQuery.subscribe(() => {
      this._invalidate++;
      if (this.#iteratorAccessed) {
        notifyPropertyChange(this, '[]');
      }
    });
    registerDestructor(this, unsubscribe);
    associateDestroyableChild(this.#identityMap, this);
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
