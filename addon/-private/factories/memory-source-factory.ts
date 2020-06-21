import MemorySource, { MemorySourceSettings } from '@orbit/memory';

export default {
  create(injections: MemorySourceSettings = {}): MemorySource {
    injections.name = injections.name || 'store';
    return new MemorySource(injections);
  }
};
