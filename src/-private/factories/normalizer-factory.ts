import {
  ModelAwareNormalizer,
  type ModelRecordNormalizerSettings,
} from '../utils/model-aware-normalizer.ts';
import { orbitRegistry } from '../utils/orbit-registry.ts';

export default {
  create(injections: ModelRecordNormalizerSettings): ModelAwareNormalizer {
    injections.keyMap = orbitRegistry.services.keyMap;
    injections.schema = orbitRegistry.services.schema;

    return new ModelAwareNormalizer(injections);
  },
};
