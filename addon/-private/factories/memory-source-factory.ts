import MemorySource, { MemorySourceSettings } from '@orbit/memory';

export default {
  create(injections: MemorySourceSettings = {}) {
    injections.name = injections.name || 'store';
    (injections.cacheSettings as any) = {
      debounceLiveQueries: false
    };
    return new MemorySource(injections);
  }
};
