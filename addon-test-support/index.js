import { getContext } from '@ember/test-helpers';
import { Promise } from 'rsvp';

export async function waitForSource(sourceOrSourceName) {
  let source;
  if (typeof sourceOrSourceName === 'string') {
    let { owner } = getContext();
    source = owner.lookup(`data-source:${sourceOrSourceName}`);
    if (!source) {
      throw new Error(`data-source:${sourceOrSourceName} not found. Maybe you misspelled it?`);
    }
  } else {
    source = sourceOrSourceName;
  }

  let promise;
  if (source.requestQueue.empty) {
    promise = Promise.resolve();
  } else {
    promise = new Promise(function (resolve, reject) {
      source.requestQueue.on('complete', resolve);
      source.requestQueue.on('fail', reject);
    });
  }
  return promise.then(() => {
    if (source.syncQueue.empty) {
      return Promise.resolve();
    } else {
      return new Promise(function(resolve, reject) {
        source.syncQueue.on('complete', resolve);
        source.syncQueue.on('fail', reject);
      });
    }
  });
}
