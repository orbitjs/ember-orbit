import { Orbit } from '@orbit/core';
import { KeyDefinition } from '@orbit/data';

import Model from '../model';
import { getKeyCache } from '../utils/property-cache';
import { defineKey } from '../utils/model-definition';

const { assert } = Orbit;

export default function key(target: Model, key: string);
export default function key(options?: KeyDefinition);
export default function key(options: Model | KeyDefinition = {}, _?: unknown) {
  function trackedKey(target: any, property: string, _: PropertyDescriptor) {
    function get(this: Model) {
      assert(
        `The ${this.type} record has been removed from the store, so we cannot lookup the ${property} key from the cache.`,
        !this.disconnected
      );

      return getKeyCache(this, property).value;
    }

    function set(this: Model, value: any) {
      const oldValue = this.getKey(property);

      if (value !== oldValue) {
        this.assertMutableFields();
        this.replaceKey(property, value).catch(() =>
          getKeyCache(this, property).notifyPropertyChange()
        );
        getKeyCache(this, property).value = value;
      }
    }

    defineKey(target, property, options as KeyDefinition);

    return { get, set };
  }

  if (arguments.length === 3) {
    options = {};
    return trackedKey.apply(null, arguments);
  }

  return trackedKey;
}
