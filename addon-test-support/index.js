import { getContext } from '@ember/test-helpers';
import { Promise } from 'rsvp';

export default async function waitForSource(sourceName) {
  let { owner } = getContext();
  let source = owner.lookup(`data-source:${sourceName}`);
  if (source) {
    return new Promise(function(resolve, reject) {
      source.syncQueue.on('complete', resolve);
      source.syncQueue.on('fail', reject);
    });
  } else {
    throw new Error(`data-source:${sourceName} not found. Maybe you misspelled it?`);
  }
}
