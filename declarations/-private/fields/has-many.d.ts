import Model from '../model.ts';
import type { HasManyRelationshipDefinition } from '@orbit/records';
export interface TrackedHasMany {
    get(this: Model): Model[];
}
export default function hasMany(type: string | string[]): any;
export default function hasMany(def: Partial<HasManyRelationshipDefinition>): any;
export default function hasMany(type: string | string[], def?: Partial<HasManyRelationshipDefinition>): any;
//# sourceMappingURL=has-many.d.ts.map