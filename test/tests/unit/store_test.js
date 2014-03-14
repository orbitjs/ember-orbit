import Orbit from 'orbit';
import Schema from 'ember_orbit/schema';
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
