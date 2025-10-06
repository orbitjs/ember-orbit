import type { IdentitySerializer } from '@orbit/identity-map';
import {
  deserializeRecordIdentity,
  serializeRecordIdentity,
  type RecordIdentity,
} from '@orbit/records';

export class RecordIdentitySerializer
  implements IdentitySerializer<RecordIdentity>
{
  serialize(identity: RecordIdentity) {
    return serializeRecordIdentity(identity);
  }
  deserialize(identifier: string) {
    return deserializeRecordIdentity(identifier);
  }
}

const recordIdentitySerializer = new RecordIdentitySerializer();

export default recordIdentitySerializer;
