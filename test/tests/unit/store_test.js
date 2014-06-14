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
      models: {
        planet: Planet
      }
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
  var container = new Ember.Container();
  container.register('schema:main', Schema);

  var store2 = Store.create({container: container});
  var schema2 = get(store2, 'schema');
  ok(schema2, "schema has been created");
  ok(schema2 instanceof Schema, "schema is a `Schema`");
});

test("#createContext creates a context and assigns its `store`", function() {
  var context = store.createContext();
  equal(get(context, 'store'), store);
});

