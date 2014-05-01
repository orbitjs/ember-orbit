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
      models: {
        planet: Planet
      }
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

test("#add will add a new instance of a model", function() {
  Ember.run(function() {
    context.add('planet', {name: 'Earth'}).then(function(planet) {
      equal(planet.get('name'), 'Earth');
    });
  });
});

test("#find will asynchronously return a record when called with a `type` and a single `id`", function() {
  Ember.run(function() {
    context.add('planet', {name: 'Earth'}).then(function(planet) {
      context.find('planet', planet.get('__id__')).then(function(foundPlanet) {
        strictEqual(foundPlanet, planet);
      });
    });
  });
});

test("#find will asynchronously fail if a record can't be found", function() {
  Ember.run(function() {
    context.add('planet', {name: 'Earth'}).then(function(planet) {
      context.find('planet', 'bogus').then(function(foundPlanet) {
        ok(false);
      }, function(e) {
        ok(e instanceof RecordNotFoundException);
      });
    });
  });
});

test("#find will asynchronously return an array of records when called with a `type` and an array of `ids`", function() {
  expect(3);

  Ember.run(function() {
    var planets = [],
        ids = [];

    context.add('planet', {name: 'Earth'}).then(function(planet) {
      planets.push(planet);
      ids.push(planet.get('__id__'));
      return context.add('planet', {name: 'Jupiter'});

    }).then(function(planet) {
      planets.push(planet);
      ids.push(planet.get('__id__'));

    }).then(function() {
      context.find('planet', ids).then(function(foundPlanets) {
        equal(foundPlanets.length, planets.length, 'same number of planets created and found');

        for (var i = 0; i < planets.length; i++) {
          strictEqual(foundPlanets[i], planets[i], 'found planet matches created planet');
        }
      });
    });
  });
});

test("#find will asynchronously return an array of all records when called with just a `type`", function() {
  expect(3);

  Ember.run(function() {
    var planets = [],
        ids = [];

    context.add('planet', {name: 'Earth'}).then(function(planet) {
      planets.push(planet);
      ids.push(planet.get('__id__'));
      return context.add('planet', {name: 'Jupiter'});

    }).then(function(planet) {
      planets.push(planet);
      ids.push(planet.get('__id__'));

    }).then(function() {
      context.find('planet').then(function(foundPlanets) {
        equal(foundPlanets.length, planets.length, 'same number of planets created and found');

        for (var i = 0; i < planets.length; i++) {
          strictEqual(foundPlanets[i], planets[i], 'found planet matches created planet');
        }
      });
    });
  });
});

test("#find will asynchronously return an array of records when called with a `type` and a query object", function() {
  expect(2);

  Ember.run(function() {
    var planets = [],
        ids = [];

    context.add('planet', {name: 'Earth'}).then(function(planet) {
      planets.push(planet);
      ids.push(planet.get('__id__'));
      return context.add('planet', {name: 'Jupiter'});

    }).then(function(planet) {
      planets.push(planet);
      ids.push(planet.get('__id__'));

    }).then(function() {
      context.find('planet', {name: 'Jupiter'}).then(function(foundPlanets) {
        equal(foundPlanets.length, 1, 'only one planet is named "Jupiter"');

        strictEqual(foundPlanets[0], planets[1], 'found planet matches created planet');
      });
    });
  });
});

test("#remove will asynchronously remove a record when called with a `type` and a single `id`", function() {
  expect(2);

  Ember.run(function() {
    context.add('planet', {name: 'Earth'}).then(function(planet) {
      var id = planet.get('__id__');

      strictEqual(context.recordForId('planet', id), planet);

      context.remove('planet', id).then(function() {
        strictEqual(context.recordForId('planet', id), undefined);
      });
    });
  });
});

test("#recordForId can synchronously retrieve a record by id", function() {
  Ember.run(function() {
    context.add('planet', {name: 'Earth'}).then(function(planet) {
      var planet2 = context.recordForId('planet', planet.get('__id__'));
      strictEqual(planet2, planet);
    });
  });
});

test("#recordForId will return undefined if the record has never been retrieved", function() {
  Ember.run(function() {
    context.add('planet', {name: 'Earth'}).then(function(planet) {
      var foundPlanet = context.recordForId('planet', 'bogusId');
      strictEqual(foundPlanet, undefined);
    });
  });
});

