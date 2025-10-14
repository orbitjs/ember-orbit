import type Owner from '@ember/owner';
import type ModelFactory from '../model-factory.ts';
import type Store from '../store.ts';
import type { Coordinator, Strategy } from '@orbit/coordinator';
import type { Bucket } from '@orbit/core';
import type { Source } from '@orbit/data';
import type { RecordIdentity, RecordKeyMap, RecordNormalizer, RecordSchema, StandardRecordValidator, UninitializedRecord } from '@orbit/records';
import type { StandardValidator, ValidatorForFn } from '@orbit/validators';
export type ServicesMap = {
    dataCoordinator: Coordinator;
    dataKeyMap: RecordKeyMap;
    dataNormalizer: RecordNormalizer<string, RecordIdentity, UninitializedRecord>;
    dataSchema: RecordSchema;
    dataValidator: ValidatorForFn<StandardValidator | StandardRecordValidator>;
    store: Store;
};
export declare class OrbitRegistry {
    registrations: {
        buckets: Record<'main', Bucket>;
        models: Record<string, ModelFactory>;
        sources: Record<string, Source>;
        strategies: Record<string, Strategy>;
    };
    services: ServicesMap;
    schemaVersion?: number;
    getRegisteredModels(): string[];
}
export declare function getOrbitRegistry(owner: Owner): OrbitRegistry;
//# sourceMappingURL=orbit-registry.d.ts.map