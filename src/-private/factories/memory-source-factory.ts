import { applyStandardSourceInjections } from '../utils/standard-injections.ts';
import { MemorySource, type MemorySourceSettings } from '@orbit/memory';

export default {
  create(injections: MemorySourceSettings): MemorySource {
    applyStandardSourceInjections(injections);
    injections.name = injections.name ?? 'store';
    injections.cacheSettings = { debounceLiveQueries: false };
    return new MemorySource(injections);
  },
};
