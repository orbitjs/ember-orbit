import {
  ModelAwareNormalizer,
  ModelRecordNormalizerSettings
} from '../utils/model-aware-normalizer';

export default {
  create(injections: ModelRecordNormalizerSettings): ModelAwareNormalizer {
    return new ModelAwareNormalizer(injections);
  }
};
