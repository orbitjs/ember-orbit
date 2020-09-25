import { AttributeDefinition } from '@orbit/data';

import Model from '../model';
import { Cache } from '../utils/property-cache';
import { defineAttribute } from '../utils/model-definition';

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
        this.replaceAttribute(property, value).catch(() =>
          getCache(this).notifyPropertyChange()
        );
        getCache(this).value = value;
      }
    }

    defineAttribute(
      target,
      property,
      options as AttributeDefinition,
      (record: Model) => {
        const cache = caches.get(record);
        if (cache) {
          cache.notifyPropertyChange();
        }
      }
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
