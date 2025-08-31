import { getOwner } from '@ember/application';
import type ApplicationInstance from '@ember/application/instance';
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
import type { OrbitConfig } from '../system/ember-orbit-setup.ts';

export function applyStandardSourceInjections(
  injections: RecordSourceSettings,
): void {
  const app = getOwner(injections) as ApplicationInstance;
  const orbitConfig = app.lookup('ember-orbit:config') as OrbitConfig;

  if (!orbitConfig.skipSchemaService) {
    injections.schema = app.lookup(
      `service:${orbitConfig.services.schema}`,
    ) as RecordSchema;
  }
  if (!orbitConfig.skipBucketService) {
    injections.bucket = app.lookup(
      `service:${orbitConfig.services.bucket}`,
    ) as Bucket<unknown>;
  }
  if (!orbitConfig.skipKeyMapService) {
    injections.keyMap = app.lookup(
      `service:${orbitConfig.services.keyMap}`,
    ) as RecordKeyMap;
  }
  if (!orbitConfig.skipNormalizerService) {
    injections.normalizer = app.lookup(
      `service:${orbitConfig.services.normalizer}`,
    ) as RecordNormalizer<string, RecordIdentity, UninitializedRecord>;
  }
  if (orbitConfig.skipValidatorService) {
    injections.autoValidate = false;
  } else {
    injections.validatorFor = app.lookup(
      `service:${orbitConfig.services.validator}`,
    ) as ValidatorForFn<StandardValidator | StandardRecordValidator>;
  }
}
