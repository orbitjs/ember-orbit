import { Orbit } from '@orbit/core';
import { RelationshipDefinition } from '@orbit/records';

import Model from '../model';
import { getHasOneCache } from '../utils/property-cache';
import { defineRelationship } from '../utils/model-definition';

const { assert } = Orbit;

export interface TrackedHasOne {
  get(this: Model): Model | null;
  set(this: Model, value: Model | null): void;
}

export default function hasOne(
  type: string | string[],
  options: Partial<RelationshipDefinition> = {}
): any {
  function trackedHasOne(
    target: any,
    property: string,
    _: PropertyDescriptor
  ): TrackedHasOne {
    if (!options.type) {
      throw new TypeError('@hasOne() require `type` argument.');
    }

    function get(this: Model): Model | null {
      assert(
        `The ${this.type} record has been removed from the store, so we cannot lookup the ${property} hasOne from the cache.`,
        !this.disconnected
      );

      return getHasOneCache(this, property).value as Model | null;
    }

    function set(this: Model, value: Model | null) {
      const oldValue = this.getRelatedRecord(property);

      if (value !== oldValue) {
        this.assertMutableFields();
        this.replaceRelatedRecord(property, value).catch(() =>
          getHasOneCache(this, property).notifyPropertyChange()
        );
      }
    }

    defineRelationship(target, property, options);

    return { get, set };
  }

  if (arguments.length === 3) {
    options = {};
    return trackedHasOne.apply(null, arguments as any);
  }

  options.type = type;
  options.kind = 'hasOne';
  return trackedHasOne;
}
