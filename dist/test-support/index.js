
import { g as getOrbitRegistry } from '../orbit-registry-BOeq-4ry.js';

async function waitForSource(sourceOrSourceName, owner) {
  let source;
  if (typeof sourceOrSourceName === 'string') {
    const orbitRegistry = getOrbitRegistry(owner);
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
