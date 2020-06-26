import { RelationshipDefinition } from '@orbit/data';

import Model from '../model';
import { Cache } from '../utils/property-cache';

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
        cache = new Cache(() => record.getRelatedRecords(property));
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
