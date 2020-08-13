import { AttributeDefinition } from '@orbit/data';

import Model from '../model';
import { Cache } from '../utils/property-cache';

export default function attr(target: Model, key: string);
export default function attr(type?: string, options?: AttributeDefinition);
export default function attr(
  type?: Model | string,
  options: string | AttributeDefinition = {}
) {
  function trackedAttr(target: any, property: string, _: PropertyDescriptor) {
    const caches = new WeakMap<Model, Cache<unknown>>();
    function getCache(record: Model): Cache<unknown> {
      let cache = caches.get(record);
      if (!cache) {
        cache = new Cache(() => record.getAttribute(property));
        caches.set(record, cache);
      }
      return cache;
    }

    function get(this: Model) {
      return getCache(this).value;
    }

    function set(this: Model, value: any) {
      const oldValue = this.getAttribute(property);

      if (value !== oldValue) {
        this.assertMutableFields();
        this.update({ [property]: value }).catch(() =>
          getCache(this).notifyPropertyChange()
        );
        getCache(this).value = value;
      }
    }

    Reflect.defineMetadata('orbit:attribute', options, target, property);
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

  if (typeof options === 'string') {
    options = {};
    return trackedAttr.apply(null, arguments);
  }

  options.type = type as string;
  return trackedAttr;
}
