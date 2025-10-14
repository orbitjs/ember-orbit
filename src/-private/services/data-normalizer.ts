import { getOwner } from '@ember/owner';
import type Owner from '@ember/owner';
import {
  ModelAwareNormalizer,
  type ModelRecordNormalizerSettings,
} from '../utils/model-aware-normalizer.ts';
import { getOrbitRegistry } from '../utils/orbit-registry.ts';

export default {
  create(injections: ModelRecordNormalizerSettings): ModelAwareNormalizer {
    const owner = getOwner(injections) as Owner;
    const orbitRegistry = getOrbitRegistry(owner);
    injections.keyMap = orbitRegistry.services.dataKeyMap;
    injections.schema = orbitRegistry.services.dataSchema;

    return new ModelAwareNormalizer(injections);
  },
};
