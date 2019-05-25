import { getContext } from '@ember/test-helpers';

export async function waitForSource(sourceOrSourceName) {
  let source;
  if (typeof sourceOrSourceName === 'string') {
    let { owner } = getContext();
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
