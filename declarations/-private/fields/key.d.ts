import Model from '../model.ts';
import type { KeyDefinition } from '@orbit/records';
export interface TrackedKey {
    get(this: Model): string;
    set(this: Model, value: string): void;
}
export default function key(options?: KeyDefinition): any;
//# sourceMappingURL=key.d.ts.map