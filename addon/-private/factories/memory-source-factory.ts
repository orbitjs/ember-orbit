import MemorySource, { MemorySourceSettings } from '@orbit/memory';

export default {
  create(injections: MemorySourceSettings = {}): MemorySource {
    injections.name = injections.name || 'store';
    injections.cacheSettings = { debounceLiveQueries: false } as any;
    return new MemorySource(injections);
  }
};
