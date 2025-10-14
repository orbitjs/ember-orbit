import type Owner from '@ember/owner';
import { getOrbitRegistry } from '../-private/utils/orbit-registry.ts';
import type { Store } from '../index.ts';
import type { Source } from '@orbit/data';

export async function waitForSource(
  sourceOrSourceName: Store | Source | string,
  owner: Owner,
): Promise<void> {
  let source;
  if (typeof sourceOrSourceName === 'string') {
    const orbitRegistry = getOrbitRegistry(owner);
    source = orbitRegistry.registrations.sources[sourceOrSourceName] as Source;
    if (!source) {
      throw new Error(
        `data-source:${sourceOrSourceName} not found. Maybe you misspelled it?`,
      );
    }
  } else {
    source = sourceOrSourceName;
  }

  await source.requestQueue.process();
  await source.syncQueue.process();
}
