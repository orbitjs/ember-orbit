import { RelationshipDefinition } from '@orbit/data';

import Model from '../model';
import { Cache } from '../utils/property-cache';

export default function hasOne(
  type: string | string[],
  options: Partial<RelationshipDefinition> = {}
) {
  function trackedHasOne(target: any, property: string, _: PropertyDescriptor) {
    if (!options.type) {
      throw new TypeError('@hasOne() require `type` argument.');
    }

    const caches = new WeakMap<Model, Cache<Model | null | undefined>>();
    function getCache(record: Model): Cache<Model | null | undefined> {
      let cache = caches.get(record);
      if (!cache) {
        cache = new Cache(() => record.getRelatedRecord(property));
        caches.set(record, cache);
      }
      return cache;
    }

    function get(this: Model) {
      return getCache(this).value;
    }

    function set(this: Model, value: any) {
      const oldValue = this.getRelatedRecord(property);

      if (value !== oldValue) {
        this.assertMutableFields();
        this.replaceRelatedRecord(property, value).catch(() =>
          getCache(this).notifyPropertyChange()
        );
      }
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

    return { get, set };
  }

  if (arguments.length === 3) {
    options = {};
    return trackedHasOne.apply(null, arguments);
  }

  options.type = type;
  options.kind = 'hasOne';
  return trackedHasOne;
}
