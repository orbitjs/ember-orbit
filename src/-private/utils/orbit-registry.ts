import type ModelFactory from '../model-factory.ts';
import type { Strategy } from '@orbit/coordinator';
import type { Bucket } from '@orbit/core';
import type { Source } from '@orbit/data';
import type {
  RecordIdentity,
  RecordKeyMap,
  RecordNormalizer,
  RecordSchema,
  StandardRecordValidator,
  UninitializedRecord,
} from '@orbit/records';
import type { StandardValidator, ValidatorForFn } from '@orbit/validators';

type ServicesMap = {
  keyMap: RecordKeyMap;
  normalizer: RecordNormalizer<string, RecordIdentity, UninitializedRecord>;
  schema: RecordSchema;
  validatorFor: ValidatorForFn<StandardValidator | StandardRecordValidator>;
};

class OrbitRegistry {
  registrations: {
    buckets: Record<'main', Bucket>;
    models: Record<string, ModelFactory>;
    sources: Record<string, Source>;
    strategies: Record<string, Strategy>;
  } = {
    buckets: {} as Record<'main', Bucket>,
    models: {},
    sources: {},
    strategies: {},
  };
  services: ServicesMap = {} as ServicesMap;
  schemaVersion?: number;
}

export const orbitRegistry = new OrbitRegistry();
