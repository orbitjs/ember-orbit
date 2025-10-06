import { orbitRegistry } from './orbit-registry.ts';
import type {
  RecordIdentity,
  RecordKeyMap,
  RecordNormalizer,
  RecordSchema,
  RecordSourceSettings,
  StandardRecordValidator,
  UninitializedRecord,
} from '@orbit/records';
import type { StandardValidator, ValidatorForFn } from '@orbit/validators';

export function applyStandardSourceInjections(
  injections: RecordSourceSettings,
): void {
  injections.schema = orbitRegistry.registrations.services[
    'data-schema'
  ] as RecordSchema;

  injections.bucket = orbitRegistry.registrations.buckets['main'];

  injections.keyMap = orbitRegistry.registrations.services[
    'data-key-map'
  ] as RecordKeyMap;

  injections.normalizer = orbitRegistry.registrations.services[
    'data-normalizer'
  ] as RecordNormalizer<string, RecordIdentity, UninitializedRecord>;

  injections.validatorFor = orbitRegistry.registrations.services[
    'data-validator'
  ] as ValidatorForFn<StandardValidator | StandardRecordValidator>;
}
