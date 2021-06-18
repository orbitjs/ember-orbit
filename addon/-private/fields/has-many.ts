import { Orbit } from '@orbit/core';
import { HasManyRelationshipDefinition } from '@orbit/records';

import Model from '../model';
import { getHasManyCache } from '../utils/property-cache';
import { defineRelationship } from '../utils/model-definition';

const { assert } = Orbit;

export interface TrackedHasMany {
  get(this: Model): Model[];
}

export default function hasMany(type: string | string[]): any;
export default function hasMany(
  def: Partial<HasManyRelationshipDefinition>
): any;
export default function hasMany(
  type: string | string[],
  def?: Partial<HasManyRelationshipDefinition>
): any;
export default function hasMany(
  typeOrDef: string | string[] | Partial<HasManyRelationshipDefinition>,
  def?: Partial<HasManyRelationshipDefinition>
): any {
  let relDef: Partial<HasManyRelationshipDefinition>;

  if (typeof typeOrDef === 'string' || Array.isArray(typeOrDef)) {
    relDef = def ?? {};
    relDef.type = typeOrDef;
  } else {
    relDef = typeOrDef;

    assert(
      '@hasMany can be defined with a `type` and `definition` object but not two `definition` objects',
      def === undefined
    );

    assert('@hasMany() requires a `type` argument.', relDef.type !== undefined);
  }

  relDef.kind = 'hasMany';

  return (target: Model, property: string): TrackedHasMany => {
    function get(this: Model): Model[] {
      assert(
        `The ${this.type} record has been removed from the store, so we cannot lookup the ${property} hasMany from the cache.`,
        !this.$disconnected
      );

      return getHasManyCache(this, property).value as Model[];
    }

    defineRelationship(
      target,
      property,
      relDef as HasManyRelationshipDefinition
    );

    return { get };
  };
}
