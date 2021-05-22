import { MemorySource, MemorySourceSettings } from '@orbit/memory';

export default {
  create(injections: MemorySourceSettings): MemorySource {
    injections.name = injections.name ?? 'store';
    injections.cacheSettings = { debounceLiveQueries: false };
    return new MemorySource(injections);
  }
};
