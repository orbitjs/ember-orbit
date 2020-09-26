import { tracked } from '@glimmer/tracking';
import { createCache, getValue } from '@glimmer/tracking/primitives/cache';
import { Orbit } from '@orbit/core';
import { DEBUG } from '@glimmer/env';

import Model from '../model';

const { deprecate } = Orbit;

const values = new WeakMap<Cache<unknown>, unknown>();
const caches = new WeakMap<Model, Record<string, Cache<unknown>>>();

export class Cache<T> {
  @tracked invalidate = 0;

  #value = createCache(() => {
    this.invalidate;
    if (values.has(this)) {
      return values.get(this);
    }
    return this.#getter();
  });
  #getter: () => T;

  constructor(getter: () => T) {
    this.#getter = getter;
  }

  get value(): T {
    return getValue(this.#value);
  }

  set value(value: T) {
    values.set(this, value);
    this.invalidate++;
  }

  notifyPropertyChange() {
    values.delete(this);
    this.invalidate++;
  }
}

export function notifyPropertyChange(record: Model, property: string) {
  const cache = caches.get(record);
  if (cache && cache[property]) {
    cache[property].notifyPropertyChange();
  }
}

export function getKeyCache(record: Model, property: string): Cache<unknown> {
  let cache = caches.get(record);

  if (!cache) {
    cache = {};
    caches.set(record, cache);
  }
  if (!cache[property]) {
    cache[property] = new Cache(() => record.getKey(property));
  }

  return cache[property];
}

export function getAttributeCache(
  record: Model,
  property: string
): Cache<unknown> {
  let cache = caches.get(record);

  if (!cache) {
    cache = {};
    caches.set(record, cache);
  }
  if (!cache[property]) {
    cache[property] = new Cache(() => record.getAttribute(property));
  }

  return cache[property];
}

export function getHasOneCache(
  record: Model,
  property: string
): Cache<unknown> {
  let cache = caches.get(record);

  if (!cache) {
    cache = {};
    caches.set(record, cache);
  }
  if (!cache[property]) {
    cache[property] = new Cache(() => record.getRelatedRecord(property));
  }

  return cache[property];
}

export function getHasManyCache(
  record: Model,
  property: string
): Cache<unknown> {
  let cache = caches.get(record);

  if (!cache) {
    cache = {};
    caches.set(record, cache);
  }
  if (!cache[property]) {
    cache[property] = new Cache(() =>
      addLegacyMutationMethods(
        record,
        property,
        record.getRelatedRecords(property) || []
      )
    );
  }

  return cache[property];
}

function addLegacyMutationMethods(
  owner: Model,
  relationship: string,
  records: ReadonlyArray<Model>
) {
  if (DEBUG) {
    records = [...records];
  }

  Object.defineProperties(records, {
    pushObject: {
      value: (record: Model) => {
        deprecate(
          'pushObject(record) is deprecated. Use record.addToRelatedRecords(relationship, record)'
        );
        owner.addToRelatedRecords(relationship, record);
      }
    },
    removeObject: {
      value: (record: Model) => {
        deprecate(
          'removeObject(record) is deprecated. Use record.removeFromRelatedRecords(relationship, record)'
        );
        owner.removeFromRelatedRecords(relationship, record);
      }
    }
  });

  if (DEBUG) {
    return Object.freeze(records);
  }

  return records;
}
