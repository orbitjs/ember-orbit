import Orbit from 'orbit';
import attr from 'ember_orbit/attr';
import Context from 'ember_orbit/context';
import Store from 'ember_orbit/store';
import Model from 'ember_orbit/model';
import { createStore } from 'test_helper';

var get = Ember.get,
    set = Ember.set;

var Planet,
    store,
    context;

module("Unit - Context", {
  setup: function() {
    Orbit.Promise = Ember.RSVP.Promise;

    Planet = Model.extend({
      name: attr('string'),
    });

    store = createStore({
      planet: Planet
    });

    context = Context.create({
      store: store
    });
  },

  teardown: function() {
    store = null;
  }
});

test("it exists", function() {
  ok(context);
});

test("it has a properly defined schema", function() {
  var schema = context.get('schema');
  ok(schema, 'it has a schema');
  ok(schema._schema.models.planet, 'models are defined');
});

test("#createRecord can create a new instance of a model", function() {
  Ember.run(function() {
    context.createRecord('planet', {name: 'Earth'}).then(function(planet) {
      equal(planet.get('name'), 'Earth');
    });
  });
});
