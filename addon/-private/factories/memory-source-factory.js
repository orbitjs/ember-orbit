import MemorySource from '@orbit/memory';

export default {
  create(injections = {}) {
    injections.name = injections.name || 'store';
    return new MemorySource(injections);
  }
};
