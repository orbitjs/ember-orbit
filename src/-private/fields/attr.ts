import Model from '../model.ts';
import { defineAttribute } from '../utils/model-definition.ts';
import { getAttributeCache } from '../utils/property-cache.ts';
import { Orbit } from '@orbit/core';
import type { AttributeDefinition } from '@orbit/records';

const { assert } = Orbit;

export interface TrackedAttr {
  get(this: Model): unknown;
  set(this: Model, value: unknown): void;
}

export default function attr(type: string): any;
export default function attr(def: AttributeDefinition): any;
export default function attr(
  typeOrDef?: string | AttributeDefinition,
  def?: AttributeDefinition,
): any {
  let attrDef: AttributeDefinition;

  if (typeof typeOrDef === 'string') {
    attrDef = def ?? {};
    attrDef.type = typeOrDef;
  } else {
    attrDef = typeOrDef ?? {};

    assert(
      '@attr can be defined with a `type` and `definition` object but not two `definition` objects',
      def === undefined,
    );
  }

  return (target: Model, property: string): TrackedAttr => {
    function get(this: Model): unknown {
      assert(
        `The ${this.type} record has been removed from its cache, so we cannot lookup the ${property} attribute.`,
        this._cache !== undefined,
      );

      return getAttributeCache(this, property).value;
    }

    function set(this: Model, value: unknown) {
      const oldValue = this.$getAttribute(property);

      if (value !== oldValue) {
        this.$replaceAttribute(property, value);
        getAttributeCache(this, property).value = value;
      }
    }

    defineAttribute(target, property, attrDef);

    return { get, set };
  };
}
