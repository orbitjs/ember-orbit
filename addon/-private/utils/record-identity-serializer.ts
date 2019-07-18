import {
  RecordIdentity,
  serializeRecordIdentity,
  deserializeRecordIdentity
} from '@orbit/data';
import { IdentitySerializer } from '@orbit/identity-map';

export class RecordIdentitySerializer
  implements IdentitySerializer<RecordIdentity> {
  serialize(identity: RecordIdentity) {
    return serializeRecordIdentity(identity);
  }
  deserialize(identifier: string) {
    return deserializeRecordIdentity(identifier);
  }
}

const recordIdentitySerializer = new RecordIdentitySerializer();

export default recordIdentitySerializer;
