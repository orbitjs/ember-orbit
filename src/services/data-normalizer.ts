import type Owner from '@ember/owner';
import Service, { service } from '@ember/service';
import {
  type RecordFieldsOrModel,
  type RecordIdentityOrModel,
} from '../-private/utils/model-aware-types.ts';
import {
  normalizeModelFields,
  type ModelFields,
} from '../-private/utils/model-fields.ts';
import { Model } from '../index.ts';
import {
  RecordKeyMap,
  RecordSchema,
  StandardRecordNormalizer,
  type InitializedRecord,
  type RecordIdentity,
  type RecordKeyValue,
  type RecordNormalizer,
  type StandardRecordNormalizerSettings,
  type UninitializedRecord,
} from '@orbit/records';

export type ModelRecordNormalizerSettings = StandardRecordNormalizerSettings;

export function isStandardRecord(
  data: UninitializedRecord | ModelFields,
): data is UninitializedRecord {
  return (
    (data.attributes !== null && typeof data.attributes === 'object') ||
    (data.keys !== null && typeof data.keys === 'object') ||
    (data.relationships !== null && typeof data.relationships === 'object')
  );
}

export default class ModelAwareNormalizer
  extends Service
  implements
    RecordNormalizer<string, RecordIdentityOrModel, RecordFieldsOrModel>
{
  @service declare dataKeyMap: RecordKeyMap;
  @service declare dataSchema: RecordSchema;

  protected _normalizer: StandardRecordNormalizer;

  constructor(owner: Owner) {
    super(owner);

    this._normalizer = new StandardRecordNormalizer({
      keyMap: this.dataKeyMap,
      schema: this.dataSchema,
    });
  }

  get keyMap(): RecordKeyMap | undefined {
    return this._normalizer.keyMap;
  }

  get schema(): RecordSchema {
    return this._normalizer.schema;
  }

  normalizeRecordType(type: string): string {
    return this._normalizer.normalizeRecordType(type);
  }

  normalizeRecordIdentity(
    identity: RecordIdentity | RecordKeyValue | Model,
  ): RecordIdentity {
    if (identity instanceof Model) {
      return identity.$identity;
    } else {
      return this._normalizer.normalizeRecordIdentity(identity);
    }
  }

  normalizeRecord(record: RecordFieldsOrModel): InitializedRecord {
    if (record instanceof Model) {
      const data = record.$getData();
      if (data === undefined) {
        throw new Error('Model is no longer in the cache');
      } else {
        return data;
      }
    }

    const uninitializedRecord = isStandardRecord(record)
      ? record
      : normalizeModelFields(this._normalizer.schema, record);

    return this._normalizer.normalizeRecord(uninitializedRecord);
  }
}
