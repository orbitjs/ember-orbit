import { RecordSchema, type UninitializedRecord } from '@orbit/records';
export type ModelFields = {
    type: string;
    id?: string;
    [property: string]: unknown;
};
export declare function normalizeModelFields(schema: RecordSchema, properties: ModelFields): UninitializedRecord;
//# sourceMappingURL=model-fields.d.ts.map