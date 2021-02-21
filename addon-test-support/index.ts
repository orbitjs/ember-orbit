import { getContext } from '@ember/test-helpers';
import { Source } from '@orbit/data';

export async function waitForSource(
  sourceOrSourceName: Source | string
): Promise<void> {
  let source;
  if (typeof sourceOrSourceName === 'string') {
    let { owner } = getContext() as any;
    source = owner.lookup(`data-source:${sourceOrSourceName}`);
    if (!source) {
      throw new Error(
        `data-source:${sourceOrSourceName} not found. Maybe you misspelled it?`
      );
    }
  } else {
    source = sourceOrSourceName;
  }

  await source.requestQueue.process();
  await source.syncQueue.process();
}
