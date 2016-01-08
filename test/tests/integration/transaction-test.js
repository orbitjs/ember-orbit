import {
  dummyModels,
  createStore
} from 'tests/test-helper';
import Orbit from 'orbit';
import 'ember-orbit/transaction';

const { Planet, Moon, Star } = dummyModels;
const get = Ember.get;

module("Unit - Transaction", function(hooks) {
  let store;

  hooks.beforeEach(function() {
    Orbit.Promise = Ember.RSVP.Promise;

    const models = { planet: Planet, moon: Moon, star: Star };
    store = createStore({ models });
  });

  hooks.afterEach(function() {
    Orbit.Promise = null;
  });

  test("tracks changes which can then be committed to the base store", function(assert) {
    const transaction = store.createTransaction();

    return transaction
      .addRecord({type: 'planet', name: 'Jupiter', classification: 'gas giant'})
      .tap(() => transaction.commit())
      .then(jupiter => {
        const jupiterInBaseStore = store.get('cache').retrieveRecord('planet', get(jupiter, 'id'));
        assert.deepEqual(jupiterInBaseStore.get('id'), jupiter.get('id'), 'planet matches');
      });
  });
});
