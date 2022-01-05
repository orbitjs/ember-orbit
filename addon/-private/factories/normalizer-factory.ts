import { getOwner } from '@ember/application';
import {
  ModelAwareNormalizer,
  ModelRecordNormalizerSettings
} from '../utils/model-aware-normalizer';

export default {
  create(injections: ModelRecordNormalizerSettings): ModelAwareNormalizer {
    const app = getOwner(injections);
    const orbitConfig = app.lookup('ember-orbit:config');

    if (!orbitConfig.skipSchemaService) {
      injections.schema = app.lookup(`service:${orbitConfig.services.schema}`);
    }
    if (!orbitConfig.skipKeyMapService) {
      injections.keyMap = app.lookup(`service:${orbitConfig.services.keyMap}`);
    }

    return new ModelAwareNormalizer(injections);
  }
};
