import Orbit from 'orbit';
import { RecordNotFoundException, RecordAlreadyExistsException } from 'orbit_common/lib/exceptions';
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

test("#recordForId can synchronously retrieve a record by id", function() {
  Ember.run(function() {
    context.createRecord('planet', {name: 'Earth'}).then(function(planet) {
      var planet2 = context.recordForId('planet', planet.get('__id__'));
      strictEqual(planet2, planet);
    });
  });
});

test("#recordForId will return undefined if the record has never been retrieved", function() {
  Ember.run(function() {
    context.createRecord('planet', {name: 'Earth'}).then(function(planet) {
      var foundPlanet = context.recordForId('planet', 'bogusId');
      strictEqual(foundPlanet, undefined);
    });
  });
});

test("#findById will return a record asynchronously by id", function() {
  Ember.run(function() {
    context.createRecord('planet', {name: 'Earth'}).then(function(planet) {
      context.findById('planet', planet.get('__id__')).then(function(foundPlanet) {
        strictEqual(foundPlanet, planet);
      });
    });
  });
});

test("#findById will fail if a record can't be found", function() {
  Ember.run(function() {
    context.createRecord('planet', {name: 'Earth'}).then(function(planet) {
      context.findById('planet', 'bogus').then(function(foundPlanet) {
        ok(false);
      }, function(e) {
        ok(e instanceof RecordNotFoundException);
      });
    });
  });
});

test("#findByIds will return an array of records asynchronously by id", function() {
  expect(3);

  Ember.run(function() {
    var planets = [],
        ids = [];

    context.createRecord('planet', {name: 'Earth'}).then(function(planet) {
      planets.push(planet);
      ids.push(planet.get('__id__'));
      return context.createRecord('planet', {name: 'Jupiter'});

    }).then(function(planet) {
      planets.push(planet);
      ids.push(planet.get('__id__'));

    }).then(function() {
      context.findByIds('planet', ids).then(function(foundPlanets) {
        equal(planets.length, foundPlanets.length, 'same number of planets created and found');

        for (var i = 0; i < planets.length; i++) {
          strictEqual(foundPlanets[i], planets[i], 'found planet matches created planet');
        }
      });
    });
  });
});
