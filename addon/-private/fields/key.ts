import { KeyDefinition } from '@orbit/data';

import Model from '../model';
import { Cache } from '../utils/property-cache';

export default function key(target: Model, key: string);
export default function key(options?: KeyDefinition);
export default function key(options: Model | KeyDefinition = {}, _?: unknown) {
  function trackedKey(target: any, property: string, _: PropertyDescriptor) {
    const caches = new WeakMap<Model, Cache<unknown>>();
    function getCache(record: Model): Cache<unknown> {
      let cache = caches.get(record);
      if (!cache) {
        cache = new Cache(() => record.getKey(property));
        caches.set(record, cache);
      }
      return cache;
    }

    function get(this: Model) {
      return getCache(this).value;
    }

    function set(this: Model, value: any) {
      const oldValue = this.getKey(property);

      if (value !== oldValue) {
        this.assertMutableModel();
        this.replaceKey(property, value).catch(() =>
          getCache(this).notifyPropertyChange()
        );
        getCache(this).value = value;
      }
    }

    Reflect.defineMetadata('orbit:key', options, target, property);
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
    return trackedKey.apply(null, arguments);
  }

  return trackedKey;
}
