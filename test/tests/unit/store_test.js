import Orbit from 'orbit';
import Store from 'ember_orbit/store';

var store;

module("Unit - Store", {
  setup: function() {
    Orbit.Promise = Ember.RSVP.Promise;

    store = Store.create();
  },

  teardown: function() {
    store = null;
  }
});

test("it exists", function() {
  ok(store);
});