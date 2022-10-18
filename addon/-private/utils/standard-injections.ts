import { getOwner } from '@ember/application';
import { RecordSourceSettings } from '@orbit/records';

export function applyStandardSourceInjections(
  injections: RecordSourceSettings
): void {
  const app = getOwner(injections);

  if (app) {
    const orbitConfig = app.lookup('ember-orbit:config');

    if (!orbitConfig.skipSchemaService) {
      injections.schema = app.lookup(`service:${orbitConfig.services.schema}`);
    }
    if (!orbitConfig.skipBucketService) {
      injections.bucket = app.lookup(`service:${orbitConfig.services.bucket}`);
    }
    if (!orbitConfig.skipKeyMapService) {
      injections.keyMap = app.lookup(`service:${orbitConfig.services.keyMap}`);
    }
    if (!orbitConfig.skipNormalizerService) {
      injections.normalizer = app.lookup(
        `service:${orbitConfig.services.normalizer}`
      );
    }
    if (orbitConfig.skipValidatorService) {
      injections.autoValidate = false;
    } else {
      injections.validatorFor = app.lookup(
        `service:${orbitConfig.services.validator}`
      );
    }
  }
}
