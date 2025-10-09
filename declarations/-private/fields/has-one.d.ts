import Model from '../model.ts';
import type { HasOneRelationshipDefinition } from '@orbit/records';
export interface TrackedHasOne {
    get(this: Model): Model | null;
    set(this: Model, value: Model | null): void;
}
export default function hasOne(type: string | string[]): any;
export default function hasOne(def: Partial<HasOneRelationshipDefinition>): any;
export default function hasOne(type: string | string[], def?: Partial<HasOneRelationshipDefinition>): any;
//# sourceMappingURL=has-one.d.ts.map