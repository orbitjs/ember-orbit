import { Orbit } from '@orbit/core';
import type { KeyDefinition } from '@orbit/records';

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
        `The ${this.type} record has been removed from its cache, so we cannot lookup the ${property} key.`,
        this._cache !== undefined,
      );

      return getKeyCache(this, property).value as string;
    }

    function set(this: Model, value: string) {
      const oldValue = this.$getKey(property);

      if (value !== oldValue) {
        this.$replaceKey(property, value);
        getKeyCache(this, property).value = value;
      }
    }

    defineKey(target, property, options);

    return { get, set };
  };
}
