import { RelationshipDefinition } from '@orbit/data';

import Model from '../model';
import { getHasManyCache } from '../utils/property-cache';
import { defineRelationship } from '../utils/model-definition';

export default function hasMany(
  type: string | string[],
  options: Partial<RelationshipDefinition> = {}
) {
  function trackedHasMany(
    target: any,
    property: string,
    _: PropertyDescriptor
  ) {
    if (!options.type) {
      throw new TypeError('@hasMany() require `type` argument.');
    }

    function get(this: Model) {
      return getHasManyCache(this, property).value;
    }

    defineRelationship(target, property, options);

    return { get };
  }

  if (arguments.length === 3) {
    options = {};
    return trackedHasMany.apply(null, arguments);
  }

  options.type = type;
  options.kind = 'hasMany';
  return trackedHasMany;
}
