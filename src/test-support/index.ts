import { getContext } from '@ember/test-helpers';
import type ApplicationInstance from '@ember/application/instance';
import { Store } from '../index.ts';
import { Source } from '@orbit/data';

export async function waitForSource(
  sourceOrSourceName: Store | Source | string,
): Promise<void> {
  let source;
  if (typeof sourceOrSourceName === 'string') {
    const { owner } = getContext() as { owner: ApplicationInstance };
    source = owner.lookup(`data-source:${sourceOrSourceName}`) as Source;
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
