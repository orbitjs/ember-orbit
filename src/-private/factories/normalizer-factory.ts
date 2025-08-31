import { getOwner } from '@ember/application';
import {
  ModelAwareNormalizer,
  type ModelRecordNormalizerSettings,
} from '../utils/model-aware-normalizer.ts';
import type { OrbitConfig } from '../system/ember-orbit-setup.ts';
import type { RecordKeyMap, RecordSchema } from '@orbit/records';
import type ApplicationInstance from '@ember/application/instance';

export default {
  create(injections: ModelRecordNormalizerSettings): ModelAwareNormalizer {
    const app = getOwner(injections) as ApplicationInstance;
    const orbitConfig = app.lookup('ember-orbit:config') as OrbitConfig;

    if (!orbitConfig.skipSchemaService) {
      injections.schema = app.lookup(
        `service:${orbitConfig.services.schema}`,
      ) as RecordSchema;
    }
    if (!orbitConfig.skipKeyMapService) {
      injections.keyMap = app.lookup(
        `service:${orbitConfig.services.keyMap}`,
      ) as RecordKeyMap;
    }

    return new ModelAwareNormalizer(injections);
  },
};
