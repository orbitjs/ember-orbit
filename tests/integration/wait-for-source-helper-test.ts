import { Store } from 'ember-orbit';
import { MemorySource } from '@orbit/memory';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { Planet } from 'dummy/tests/support/dummy-models';
import { createStore } from 'dummy/tests/support/store';
import { waitForSource } from 'ember-orbit/test-support';
import type ApplicationInstance from '@ember/application/instance';
import type { Transform } from '@orbit/data';
import type { RecordOperation } from '@orbit/records';

module('waitForSource helper', function (hooks) {
  let store: Store;

  setupTest(hooks);

  hooks.beforeEach(function () {
    store = createStore(this.owner as ApplicationInstance, { planet: Planet });
  });

  test('it resolves once all the pending requests to the given source have synced', async function (assert) {
    const backup = new MemorySource({ schema: store.schema });

    store.on('update', async (transform: Transform<RecordOperation>) => {
      await backup.sync(transform);
    });

    await store.addRecord({ type: 'planet', name: 'Earth' });

    await waitForSource(backup);

    assert.ok(backup.requestQueue.empty);
    assert.ok(backup.syncQueue.empty);
  });

  test('it looks up data sources by name if a string is provided', async function (assert) {
    const backup = new MemorySource({ schema: store.schema });

    this.owner.register('data-source:backup', backup, { instantiate: false });

    store.on('update', async (transform: Transform<RecordOperation>) => {
      await backup.update(transform);
    });

    await store.addRecord({ type: 'planet', name: 'Earth' });

    await waitForSource('backup');

    assert.ok(backup.requestQueue.empty);
    assert.ok(backup.syncQueue.empty);
  });
});
