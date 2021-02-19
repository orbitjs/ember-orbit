import { Orbit } from '@orbit/core';
import { RelationshipDefinition } from '@orbit/records';

import Model from '../model';
import { getHasManyCache } from '../utils/property-cache';
import { defineRelationship } from '../utils/model-definition';

const { assert } = Orbit;

export interface TrackedHasMany {
  get(this: Model): Model[];
}

export default function hasMany(
  type: string | string[],
  options: Partial<RelationshipDefinition> = {}
): any {
  function trackedHasMany(
    target: any,
    property: string,
    _: PropertyDescriptor
  ): TrackedHasMany {
    if (!options.type) {
      throw new TypeError('@hasMany() require `type` argument.');
    }

    function get(this: Model): Model[] {
      assert(
        `The ${this.type} record has been removed from the store, so we cannot lookup the ${property} hasMany from the cache.`,
        !this.disconnected
      );

      return getHasManyCache(this, property).value as Model[];
    }

    defineRelationship(target, property, options);

    return { get };
  }

  if (arguments.length === 3) {
    options = {};
    return trackedHasMany.apply(null, arguments as any);
  }

  options.type = type;
  options.kind = 'hasMany';
  return trackedHasMany;
}
