import { dummyModels } from 'dummy/tests/support/dummy-models';
import { createStore } from 'dummy/tests/support/store';

const { Planet, Moon, Star } = dummyModels;
const { get } = Ember;

module('Integration - Store', function(hooks) {
  let store;

  hooks.beforeEach(function() {
    const models = { planet: Planet, moon: Moon, star: Star };
    store = createStore({ models });
  });

  hooks.afterEach(function() {
    store = null;
  });

  test('#addRecord', function(assert) {
    return store.addRecord({ type: 'planet', name: 'Earth' })
      .then(function(planet) {
         assert.ok(planet instanceof Planet);
         assert.ok(get(planet, 'id'), 'assigned id');
         assert.equal(get(planet, 'name'), 'Earth');
      });
  });

  test('#findRecord', function(assert) {
    return store.addRecord({ type: 'planet', name: 'Earth' })
      .then( record => store.findRecord('planet', record.get('id')))
      .then( planet => {
        assert.ok(planet instanceof Planet);
        assert.ok(get(planet, 'id'), 'assigned id');
        assert.equal(get(planet, 'name'), 'Earth');
      });
  });

  test('#removeRecord', function(assert) {
    return store.addRecord({ type: 'planet', name: 'Earth' })
      .tap(record => store.removeRecord(record))
      .then(record => store.findRecord('planet', record.get('id')))
      .catch(error => {
        assert.ok(error.message.match(/Record not found/));
      });
  });

  test('#query - record', function(assert) {
    let earth, jupiter;

    return store.addRecord({ type: 'planet', name: 'Earth' })
      .then(record => {
        earth = record;
        return store.addRecord({ type: 'planet', name: 'Jupiter' });
      })
      .then(record => {
        jupiter = record;
        return store.query(q => q.record(earth));
      })
      .then(record => {
        assert.strictEqual(record, earth);
      });
  });

  test('#query - recordsOfType', function(assert) {
    let earth, jupiter;

    return store.addRecord({ type: 'planet', name: 'Earth' })
      .then(record => {
        earth = record;
        return store.addRecord({ type: 'planet', name: 'Jupiter' });
      })
      .then(record => {
        jupiter = record;
        return store.query(q => q.recordsOfType('planet'));
      })
      .then(records => {
        assert.deepEqual(records, [earth, jupiter]);
        assert.strictEqual(records[0], earth);
        assert.strictEqual(records[1], jupiter);
      });
  });

  test('#query - filter', function(assert) {
    let earth, jupiter;

    return store.addRecord({ type: 'planet', name: 'Earth' })
      .then(record => {
        earth = record;
        return store.addRecord({ type: 'planet', name: 'Jupiter' });
      })
      .then(record => {
        jupiter = record;
        return store.query(q => q.recordsOfType('planet').filterAttributes({ name: 'Earth' }));
      })
      .then(records => {
        assert.deepEqual(records, [earth]);
        assert.strictEqual(records[0], earth);
      });
  });
});
