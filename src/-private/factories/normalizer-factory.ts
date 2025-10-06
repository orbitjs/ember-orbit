import {
  ModelAwareNormalizer,
  type ModelRecordNormalizerSettings,
} from '../utils/model-aware-normalizer.ts';
import { orbitRegistry } from '../utils/orbit-registry.ts';
import type { RecordKeyMap, RecordSchema } from '@orbit/records';

export default {
  create(injections: ModelRecordNormalizerSettings): ModelAwareNormalizer {
    injections.schema = orbitRegistry.registrations.services[
      'data-schema'
    ] as RecordSchema;

    injections.keyMap = orbitRegistry.registrations.services[
      'data-key-map'
    ] as RecordKeyMap;

    return new ModelAwareNormalizer(injections);
  },
};
