import {
  InitializedRecord,
  RecordIdentity,
  RecordKeyValue,
  RecordNormalizer,
  StandardRecordNormalizer,
  StandardRecordNormalizerSettings,
  UninitializedRecord
} from '@orbit/records';
import { Model } from 'ember-orbit';
import {
  RecordFieldsOrModel,
  RecordIdentityOrModel
} from './model-aware-types';
import { normalizeModelFields, ModelFields } from './model-fields';

export type ModelRecordNormalizerSettings = StandardRecordNormalizerSettings;

export function isStandardRecord(
  data: UninitializedRecord | ModelFields
): data is UninitializedRecord {
  return (
    typeof data.attributes === 'object' ||
    typeof data.keys === 'object' ||
    typeof data.attributes === 'object'
  );
}

export class ModelAwareNormalizer
  implements
    RecordNormalizer<string, RecordIdentityOrModel, RecordFieldsOrModel> {
  protected _normalizer: StandardRecordNormalizer;

  constructor(settings: ModelRecordNormalizerSettings) {
    this._normalizer = new StandardRecordNormalizer(settings);
  }

  normalizeRecordType(type: string): string {
    return this._normalizer.normalizeRecordType(type);
  }

  normalizeRecordIdentity(
    identity: RecordIdentity | RecordKeyValue | Model
  ): RecordIdentity {
    if (identity instanceof Model) {
      return identity.identity;
    } else {
      return this._normalizer.normalizeRecordIdentity(identity);
    }
  }

  normalizeRecord(record: RecordFieldsOrModel): InitializedRecord {
    if (record instanceof Model) {
      let data = record.getData();
      if (data === undefined) {
        throw new Error('Model is no longer in the cache');
      } else {
        return data;
      }
    }

    let uninitializedRecord = isStandardRecord(record)
      ? record
      : normalizeModelFields(this._normalizer.schema, record);

    return this._normalizer.normalizeRecord(uninitializedRecord);
  }
}
