import Orbit from 'orbit';
import Schema from 'ember_orbit/schema';
import Store from 'ember_orbit/store';
import { createStore } from 'test_helper';

var get = Ember.get,
    set = Ember.set;

var store,
    Planet;

module("Unit - Store", {
  setup: function() {
    Orbit.Promise = Ember.RSVP.Promise;

    // create a faux-model for unit testing
    Planet = Ember.Object.extend();

    store = createStore({
      planet: Planet
    });
  },

  teardown: function() {
    store = null;
  }
});

test("it exists", function() {
  ok(store);
});

test("it uses a schema that's been specified", function() {
  var schema2 = Schema.create(),
      store2 = Store.create({schema: schema2});
  strictEqual(store2.schema, schema2, "schema matches one that was specified");
});

test("it creates a schema if none has been specified", function() {
  var store2 = Store.create();
  ok(store2.schema, "schema has been created");
  strictEqual(store2.schema.constructor, Schema, "schema is a `Schema`");
});

test("#modelFor returns the appropriate model when passed a model's name", function() {
  equal(store.modelFor('planet'), Planet);
});

test("#modelFor returns the appropriate model when passed the model itself", function() {
  equal(store.modelFor(Planet), Planet);
});

test("#createContext creates a context and assigns its `store`", function() {
  var context = store.createContext();
  equal(get(context, 'store'), store);
});

