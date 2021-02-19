import { Orbit } from '@orbit/core';
import { AttributeDefinition } from '@orbit/records';

import Model from '../model';
import { getAttributeCache } from '../utils/property-cache';
import { defineAttribute } from '../utils/model-definition';

const { assert } = Orbit;

export interface TrackedAttr {
  get(this: Model): unknown;
  set(this: Model, value: unknown): void;
}

export default function attr(target: Model, key: string): any;
export default function attr(type?: string, options?: AttributeDefinition): any;
export default function attr(
  type?: Model | string,
  options: string | AttributeDefinition = {}
): any {
  function trackedAttr(
    target: Model,
    property: string,
    _: PropertyDescriptor
  ): TrackedAttr {
    function get(this: Model): unknown {
      assert(
        `The ${this.type} record has been removed from the store, so we cannot lookup the ${property} attr from the cache.`,
        !this.disconnected
      );

      return getAttributeCache(this, property).value;
    }

    function set(this: Model, value: unknown) {
      const oldValue = this.getAttribute(property);

      if (value !== oldValue) {
        this.assertMutableFields();
        this.replaceAttribute(property, value).catch(() =>
          getAttributeCache(this, property).notifyPropertyChange()
        );
        getAttributeCache(this, property).value = value;
      }
    }

    defineAttribute(target, property, options as AttributeDefinition);

    return { get, set };
  }

  if (typeof options === 'string') {
    options = {};
    return trackedAttr.apply(null, arguments as any);
  }

  options.type = type as string;
  return trackedAttr;
}
