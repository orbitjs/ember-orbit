import Model from '../model.ts';
import { defineRelationship } from '../utils/model-definition.ts';
import { getHasManyCache } from '../utils/property-cache.ts';
import { Orbit } from '@orbit/core';
import type { HasManyRelationshipDefinition } from '@orbit/records';

const { assert } = Orbit;

export interface TrackedHasMany {
  get(this: Model): Model[];
}

export default function hasMany(type: string | string[]): any;
export default function hasMany(
  def: Partial<HasManyRelationshipDefinition>,
): any;
export default function hasMany(
  type: string | string[],
  def?: Partial<HasManyRelationshipDefinition>,
): any;
export default function hasMany(
  typeOrDef: string | string[] | Partial<HasManyRelationshipDefinition>,
  def?: Partial<HasManyRelationshipDefinition>,
): any {
  let relDef: Partial<HasManyRelationshipDefinition>;

  if (typeof typeOrDef === 'string' || Array.isArray(typeOrDef)) {
    relDef = def ?? {};
    relDef.type = typeOrDef;
  } else {
    relDef = typeOrDef;

    assert(
      '@hasMany can be defined with a `type` and `definition` object but not two `definition` objects',
      def === undefined,
    );

    assert(
      '@hasMany() requires a `type` argument.',
      relDef?.type !== undefined,
    );
  }

  relDef.kind = 'hasMany';

  return (target: Model, property: string): TrackedHasMany => {
    function get(this: Model): Model[] {
      assert(
        `The ${this.type} record has been removed from its cache, so we cannot lookup the ${property} hasMany relationship.`,
        this._cache !== undefined,
      );

      return getHasManyCache(this, property).value as Model[];
    }

    defineRelationship(
      target,
      property,
      relDef as HasManyRelationshipDefinition,
    );

    return { get };
  };
}
