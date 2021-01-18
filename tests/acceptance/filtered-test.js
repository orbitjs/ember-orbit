import { module, test } from 'qunit';
import { visit, currentURL } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';

module('Acceptance | filtered', function (hooks) {
  setupApplicationTest(hooks);

  let redoTransform, store, undoTransform;

  hooks.beforeEach(async function () {
    store = this.owner.lookup('service:store');

    await store.update((t) => {
      const moons = [
        { type: 'moon', name: 'Blue' },
        { type: 'moon', name: 'New' }
      ];
      const operations = [];
      operations.push(t.addRecord(moons[0]));
      operations.push(t.addRecord(moons[1]));
      operations.push(t.addRecord({ type: 'planet', name: 'Pluto' }));
      operations.push(t.addRecord({ type: 'planet', name: 'Filtered' }));
      operations.push(
        t.replaceRelatedRecords(
          { type: 'planet', name: 'Pluto' },
          'moons',
          moons
        )
      );
      return operations;
    });

    const transformId = store.transformLog.head;
    redoTransform = store.getTransform(transformId).operations;
    undoTransform = store.getInverseOperations(transformId);
  });

  test('visiting /filtered', async function (assert) {
    await visit('/filtered');

    assert.equal(currentURL(), '/filtered');

    await store.update(undoTransform);

    await store.update(redoTransform);
  });
});
