import type ApplicationInstance from '@ember/application/instance';
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
  const app = orbitRegistry.application as ApplicationInstance;

  injections.schema = app.lookup('service:data-schema') as RecordSchema;

  injections.bucket = orbitRegistry.registrations.buckets['main'];

  injections.keyMap = app.lookup('service:data-key-map') as RecordKeyMap;

  injections.normalizer = app.lookup(
    'service:data-normalizer',
  ) as RecordNormalizer<string, RecordIdentity, UninitializedRecord>;

  injections.validatorFor = app.lookup(
    'service:data-validator',
  ) as ValidatorForFn<StandardValidator | StandardRecordValidator>;
}
