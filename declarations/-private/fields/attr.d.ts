import Model from '../model.ts';
import type { AttributeDefinition } from '@orbit/records';
export interface TrackedAttr {
    get(this: Model): unknown;
    set(this: Model, value: unknown): void;
}
export default function attr(type: string): any;
export default function attr(def: AttributeDefinition): any;
//# sourceMappingURL=attr.d.ts.map