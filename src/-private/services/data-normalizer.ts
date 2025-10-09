import {
  ModelAwareNormalizer,
  type ModelRecordNormalizerSettings,
} from '../utils/model-aware-normalizer.ts';
import { orbitRegistry } from '../utils/orbit-registry.ts';

export default {
  create(injections: ModelRecordNormalizerSettings): ModelAwareNormalizer {
    injections.keyMap = orbitRegistry.services.dataKeyMap;
    injections.schema = orbitRegistry.services.dataSchema;

    return new ModelAwareNormalizer(injections);
  },
};
