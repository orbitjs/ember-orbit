import type Store from '../store.ts';
import type { ModelAwareNormalizer } from '../utils/model-aware-normalizer.ts';
import type { Coordinator } from '@orbit/coordinator';
import type {
  RecordKeyMap,
  RecordSchema,
  StandardRecordValidator,
} from '@orbit/records';
import type { StandardValidator, ValidatorForFn } from '@orbit/validators';

// Map service names to their actual types
export interface OrbitServiceRegistry {
  'data-coordinator': Coordinator;
  'data-key-map': RecordKeyMap;
  'data-normalizer': ModelAwareNormalizer;
  'data-schema': RecordSchema;
  'data-validator': ValidatorForFn<StandardValidator | StandardRecordValidator>;
  store: Store;
}

export type OrbitServiceName = keyof OrbitServiceRegistry;
