import type ApplicationInstance from '@ember/application/instance';
import { orbitRegistry } from '../system/ember-orbit-setup.ts';
import type { Bucket } from '@orbit/core';
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

  // TODO: Either register the main bucket as 'service:data-bucket' or look this up from `orbitRegistry`
  injections.bucket = app.lookup('service:data-bucket') as Bucket<unknown>;

  injections.keyMap = app.lookup('service:data-key-map') as RecordKeyMap;

  injections.normalizer = app.lookup(
    'service:data-normalizer',
  ) as RecordNormalizer<string, RecordIdentity, UninitializedRecord>;

  injections.validatorFor = app.lookup(
    'service:data-validator',
  ) as ValidatorForFn<StandardValidator | StandardRecordValidator>;
}
