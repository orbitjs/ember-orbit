import { Orbit } from '@orbit/core';
import { KeyDefinition } from '@orbit/records';

import Model from '../model';
import { getKeyCache } from '../utils/property-cache';
import { defineKey } from '../utils/model-definition';

const { assert } = Orbit;

export interface TrackedKey {
  get(this: Model): string;
  set(this: Model, value: string): void;
}

export default function key(options: KeyDefinition = {}): any {
  return (target: Model, property: string): TrackedKey => {
    function get(this: Model): string {
      assert(
        `The ${this.type} record has been removed from the store, so we cannot lookup the ${property} key from the cache.`,
        !this.$disconnected
      );

      return getKeyCache(this, property).value as string;
    }

    function set(this: Model, value: string) {
      const oldValue = this.$getKey(property);

      if (value !== oldValue) {
        this.$assertMutableFields();
        this.$replaceKey(property, value).catch(() =>
          getKeyCache(this, property).notifyPropertyChange()
        );
        getKeyCache(this, property).value = value;
      }
    }

    defineKey(target, property, options as KeyDefinition);

    return { get, set };
  };
}
