import { Orbit } from '@orbit/core';
import { RelationshipDefinition } from '@orbit/data';
import { DEBUG } from '@glimmer/env';

import Model from '../model';
import { Cache } from '../utils/property-cache';

const { deprecate } = Orbit;

export default function hasMany(
  type: string | string[],
  options: Partial<RelationshipDefinition> = {}
) {
  function trackedHasMany(
    target: any,
    property: string,
    _: PropertyDescriptor
  ) {
    if (!options.type) {
      throw new TypeError('@hasMany() require `type` argument.');
    }

    const caches = new WeakMap<Model, Cache<unknown>>();
    function getCache(record: Model): Cache<unknown> {
      let cache = caches.get(record);
      if (!cache) {
        cache = new Cache(() =>
          addLegacyMutationMethods(
            record,
            property,
            record.relatedRecords(property).peek() || []
          )
        );
        caches.set(record, cache);
      }
      return cache;
    }

    function get(this: Model) {
      return getCache(this).value;
    }

    Reflect.defineMetadata('orbit:relationship', options, target, property);
    Reflect.defineMetadata(
      'orbit:notifier',
      (record: Model) => {
        const cache = caches.get(record);
        if (cache) {
          cache.notifyPropertyChange();
        }
      },
      target,
      property
    );

    return { get };
  }

  if (arguments.length === 3) {
    options = {};
    return trackedHasMany.apply(null, arguments);
  }

  options.type = type;
  options.kind = 'hasMany';
  return trackedHasMany;
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
          'pushObject(record) is deprecated. Use record.relatedRecords(relationship).add(record)'
        );
        owner.relatedRecords(relationship).add(record);
      }
    },
    removeObject: {
      value: (record: Model) => {
        deprecate(
          'removeObject(record) is deprecated. Use record.relatedRecords(relationship).remove(record)'
        );
        owner.relatedRecords(relationship).remove(record);
      }
    }
  });

  if (DEBUG) {
    return Object.freeze(records);
  }

  return records;
}
