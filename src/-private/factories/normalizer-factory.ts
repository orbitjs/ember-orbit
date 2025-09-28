import type ApplicationInstance from '@ember/application/instance';
import {
  ModelAwareNormalizer,
  type ModelRecordNormalizerSettings,
} from '../utils/model-aware-normalizer.ts';
import { orbitRegistry } from '../utils/orbit-registry.ts';
import type { RecordKeyMap, RecordSchema } from '@orbit/records';

export default {
  create(injections: ModelRecordNormalizerSettings): ModelAwareNormalizer {
    const app = orbitRegistry.application as ApplicationInstance;

    injections.schema = app.lookup('service:data-schema') as RecordSchema;

    injections.keyMap = app.lookup('service:data-key-map') as RecordKeyMap;

    return new ModelAwareNormalizer(injections);
  },
};
