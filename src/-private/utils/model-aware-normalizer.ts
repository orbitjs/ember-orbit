import {
  type InitializedRecord,
  type RecordIdentity,
  RecordKeyMap,
  type RecordKeyValue,
  type RecordNormalizer,
  RecordSchema,
  StandardRecordNormalizer,
  type StandardRecordNormalizerSettings,
  type UninitializedRecord,
} from '@orbit/records';
import { Model } from '../../index.ts';
import {
  type RecordFieldsOrModel,
  type RecordIdentityOrModel,
} from './model-aware-types.ts';
import { normalizeModelFields, type ModelFields } from './model-fields.ts';

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

export class ModelAwareNormalizer
  implements
    RecordNormalizer<string, RecordIdentityOrModel, RecordFieldsOrModel>
{
  protected _normalizer: StandardRecordNormalizer;

  constructor(settings: ModelRecordNormalizerSettings) {
    this._normalizer = new StandardRecordNormalizer(settings);
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
