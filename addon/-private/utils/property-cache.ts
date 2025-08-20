import { tracked } from '@glimmer/tracking';
import { createCache, getValue } from '@glimmer/tracking/primitives/cache';
import { Orbit } from '@orbit/core';
import { DEBUG } from '@glimmer/env';
import { notifyPropertyChange as emberNotifyPropertyChange } from '@ember/object';

import Model from '../model';

const { deprecate } = Orbit;

const values = new WeakMap<PropertyCache<unknown>, unknown>();
const caches = new WeakMap<Model, Record<string, PropertyCache<unknown>>>();

export class PropertyCache<T> {
  @tracked invalidate = 0;

  #value: object;
  #getter: () => T;

  constructor(getter: () => T) {
    this.#getter = getter;
    this.#value = createCache<T>(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      this.invalidate;
      if (values.has(this)) {
        return values.get(this) as T;
      }
      return this.#getter();
    });
  }

  get value(): T | undefined {
    return getValue(this.#value);
  }

  set value(value: T | undefined) {
    values.set(this, value);
    this.invalidate++;
  }

  notifyPropertyChange() {
    values.delete(this);
    this.invalidate++;
  }
}

export function notifyPropertyChange(record: Model, property: string) {
  caches.get(record)?.[property]?.notifyPropertyChange();

  // TODO: there is an issue with glimmer cache and ember CP macros
  // https://github.com/ember-polyfills/ember-cache-primitive-polyfill/issues/78
  // in order to fix it for now we are calling Ember.notifyPropertyChange();
  emberNotifyPropertyChange(record, property);
}

export function getKeyCache(
  record: Model,
  property: string,
): PropertyCache<unknown> {
  let recordCaches = caches.get(record);

  if (recordCaches === undefined) {
    recordCaches = {};
    caches.set(record, recordCaches);
  }

  let propertyCache = recordCaches[property];

  if (propertyCache === undefined) {
    propertyCache = recordCaches[property] = new PropertyCache(() =>
      record.$getKey(property),
    );
  }

  return propertyCache;
}

export function getAttributeCache(
  record: Model,
  property: string,
): PropertyCache<unknown> {
  let recordCaches = caches.get(record);

  if (recordCaches === undefined) {
    recordCaches = {};
    caches.set(record, recordCaches);
  }

  let propertyCache = recordCaches[property];

  if (propertyCache === undefined) {
    propertyCache = recordCaches[property] = new PropertyCache(() =>
      record.$getAttribute(property),
    );
  }

  return propertyCache;
}

export function getHasOneCache(
  record: Model,
  property: string,
): PropertyCache<unknown> {
  let recordCaches = caches.get(record);

  if (recordCaches === undefined) {
    recordCaches = {};
    caches.set(record, recordCaches);
  }

  let propertyCache = recordCaches[property];

  if (propertyCache === undefined) {
    propertyCache = recordCaches[property] = new PropertyCache(() =>
      record.$getRelatedRecord(property),
    );
  }

  return propertyCache;
}

export function getHasManyCache(
  record: Model,
  property: string,
): PropertyCache<unknown> {
  let recordCaches = caches.get(record);

  if (recordCaches === undefined) {
    recordCaches = {};
    caches.set(record, recordCaches);
  }

  let propertyCache = recordCaches[property];

  if (propertyCache === undefined) {
    propertyCache = recordCaches[property] = new PropertyCache(() =>
      addLegacyMutationMethods(
        record,
        property,
        record.$getRelatedRecords(property) ?? [],
      ),
    );
  }

  return propertyCache;
}

function addLegacyMutationMethods(
  owner: Model,
  relationship: string,
  records: ReadonlyArray<Model>,
) {
  if (DEBUG) {
    records = [...records];
  }

  Object.defineProperties(records, {
    pushObject: {
      value: (record: Model) => {
        deprecate(
          'pushObject(record) is deprecated. Use record.addToRelatedRecords(relationship, record)',
        );
        owner.$addToRelatedRecords(relationship, record);
      },
    },
    removeObject: {
      value: (record: Model) => {
        deprecate(
          'removeObject(record) is deprecated. Use record.removeFromRelatedRecords(relationship, record)',
        );
        owner.$removeFromRelatedRecords(relationship, record);
      },
    },
  });

  if (DEBUG) {
    return Object.freeze(records);
  }

  return records;
}
