import { Model } from '../../index.ts';
import { type RecordFieldsOrModel, type RecordIdentityOrModel } from './model-aware-types.ts';
import { type ModelFields } from './model-fields.ts';
import { RecordKeyMap, RecordSchema, StandardRecordNormalizer, type InitializedRecord, type RecordIdentity, type RecordKeyValue, type RecordNormalizer, type StandardRecordNormalizerSettings, type UninitializedRecord } from '@orbit/records';
export type ModelRecordNormalizerSettings = StandardRecordNormalizerSettings;
export declare function isStandardRecord(data: UninitializedRecord | ModelFields): data is UninitializedRecord;
export declare class ModelAwareNormalizer implements RecordNormalizer<string, RecordIdentityOrModel, RecordFieldsOrModel> {
    protected _normalizer: StandardRecordNormalizer;
    constructor(settings: ModelRecordNormalizerSettings);
    get keyMap(): RecordKeyMap | undefined;
    get schema(): RecordSchema;
    normalizeRecordType(type: string): string;
    normalizeRecordIdentity(identity: RecordIdentity | RecordKeyValue | Model): RecordIdentity;
    normalizeRecord(record: RecordFieldsOrModel): InitializedRecord;
}
//# sourceMappingURL=model-aware-normalizer.d.ts.map