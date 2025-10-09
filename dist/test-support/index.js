
import { o as orbitRegistry } from '../orbit-registry-B_BsJTFB.js';

async function waitForSource(sourceOrSourceName) {
  let source;
  if (typeof sourceOrSourceName === 'string') {
    source = orbitRegistry.registrations.sources[sourceOrSourceName];
    if (!source) {
      throw new Error(`data-source:${sourceOrSourceName} not found. Maybe you misspelled it?`);
    }
  } else {
    source = sourceOrSourceName;
  }
  await source.requestQueue.process();
  await source.syncQueue.process();
}

export { waitForSource };
//# sourceMappingURL=index.js.map
