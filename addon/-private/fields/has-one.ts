import { Orbit } from '@orbit/core';
import { RelationshipDefinition } from '@orbit/data';

import Model from '../model';
import { getHasOneCache } from '../utils/property-cache';
import { defineRelationship } from '../utils/model-definition';

const { assert } = Orbit;

export default function hasOne(
  type: string | string[],
  options: Partial<RelationshipDefinition> = {}
) {
  function trackedHasOne(target: any, property: string, _: PropertyDescriptor) {
    if (!options.type) {
      throw new TypeError('@hasOne() require `type` argument.');
    }

    function get(this: Model) {
      assert(
        `The ${this.type} record has been removed from the store, so we cannot lookup the ${property} hasOne from the cache.`,
        !this.disconnected
      );

      return getHasOneCache(this, property).value;
    }

    function set(this: Model, value: any) {
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
    return trackedHasOne.apply(null, arguments);
  }

  options.type = type;
  options.kind = 'hasOne';
  return trackedHasOne;
}
