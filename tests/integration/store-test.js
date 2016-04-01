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
    Ember.run(() => {
      store
        .addRecord({ type: 'planet', name: 'Earth' })
        .then(function(planet) {
           assert.ok(planet instanceof Planet);
           assert.ok(get(planet, 'id'), 'assigned id');
           assert.equal(get(planet, 'name'), 'Earth');
        });
    });
  });

  test('#findRecord', function(assert) {
    Ember.run(() => {
      store
        .addRecord({ type: 'planet', name: 'Earth' })
        .then( record => store.findRecord('planet', record.get('id')))
        .then( planet => {
          assert.ok(planet instanceof Planet);
          assert.ok(get(planet, 'id'), 'assigned id');
          assert.equal(get(planet, 'name'), 'Earth');
        });
    });
  });

  test('#removeRecord', function(assert) {
    Ember.run(() => {
      store
        .addRecord({ type: 'planet', name: 'Earth' })
        .tap(record => store.removeRecord(record))
        .then(record => store.findRecord('planet', record.get('id')))
        .catch(error => {
          assert.ok(error.message.match(/Record not found/));
        });
    });
  });
});
