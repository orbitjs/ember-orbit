import { applyStandardSourceInjections } from 'ember-orbit';
import { MemorySource } from '@orbit/memory';

export default {
  create(injections = {}) {
    applyStandardSourceInjections(injections);

    // Note: An IndexedDBSource is typically used for data backups, since
    // obviously a MemorySource does not persist its contents. This is only
    // done as a simple demo that avoids an additional dependency.
    return new MemorySource({
      name: 'backup',
      ...injections,
    });
  },
};
