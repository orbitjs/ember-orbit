import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { Planet } from 'dummy/tests/support/dummy-models';
import EmberObject from '@ember/object';
import { createStore } from 'dummy/tests/support/store';
import { Promise as EmberPromise } from 'rsvp';
import waitForSource from 'ember-orbit/test-support';
import { Source } from '@orbit/data';

class TestSource extends Source {

}

module('waitForSource helper', function(hooks) {
  let store;
  setupTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register("data-source:backup", {
      create(injections) {
        return new TestSource(injections);
      }
    });
    store = createStore({ models: { planet: Planet } });
  });

  test('it resolves once all the pending requests to the given source have synced', async function(assert) {
    let RequesterObj = EmberObject.extend({
      init() {
        this._super(...arguments);
        this.set('planets', []);
        this.fetchAndUpdate();
      },

      async fetchAndUpdate() {
        let planets = await store.liveQuery(q => q.findRecords('planet'));
        this.set('planets', planets.map(p => p.name));
      }
    })
    await EmberPromise.all([
      store.addRecord({ type: 'planet', name: 'Earth' }),
      store.addRecord({ type: 'planet', name: 'Mercury' })
    ]);
    RequesterObj.create();
    await waitForSource('backup');
  });
});
