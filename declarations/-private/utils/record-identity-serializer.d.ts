import type { IdentitySerializer } from '@orbit/identity-map';
import { type RecordIdentity } from '@orbit/records';
export declare class RecordIdentitySerializer implements IdentitySerializer<RecordIdentity> {
    serialize(identity: RecordIdentity): string;
    deserialize(identifier: string): RecordIdentity;
}
declare const recordIdentitySerializer: RecordIdentitySerializer;
export default recordIdentitySerializer;
//# sourceMappingURL=record-identity-serializer.d.ts.map