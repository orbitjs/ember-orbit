import { MemorySource, MemorySourceSettings } from '@orbit/memory';
import { ModelAwareNormalizer } from '../utils/model-aware-normalizer';

export default {
  create(injections: MemorySourceSettings): MemorySource {
    const { schema } = injections;
    injections.name = injections.name ?? 'store';
    injections.cacheSettings = { debounceLiveQueries: false };
    injections.normalizer = new ModelAwareNormalizer({ schema });
    return new MemorySource(injections);
  }
};
