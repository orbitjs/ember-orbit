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
      atmosphere: attr('boolean'),
      classification: attr('string')
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
    Orbit.Promise = null;
    Planet = null;
    store = null;
    context = null;
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
      ok(get(planet, 'clientid'), 'assigned clientid');
      equal(planet.get('name'), 'Earth');
    });
  });
});

test("#find will asynchronously return a record when called with a `type` and a single `id`", function() {
  Ember.run(function() {
    context.add('planet', {name: 'Earth'}).then(function(planet) {
      context.find('planet', planet.get('clientid')).then(function(foundPlanet) {
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
      ids.push(planet.get('clientid'));
      return context.add('planet', {name: 'Jupiter'});

    }).then(function(planet) {
      planets.push(planet);
      ids.push(planet.get('clientid'));

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
      ids.push(planet.get('clientid'));
      return context.add('planet', {name: 'Jupiter'});

    }).then(function(planet) {
      planets.push(planet);
      ids.push(planet.get('clientid'));

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
      ids.push(planet.get('clientid'));
      return context.add('planet', {name: 'Jupiter'});

    }).then(function(planet) {
      planets.push(planet);
      ids.push(planet.get('clientid'));

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
      var id = planet.get('clientid');

      strictEqual(context.retrieve('planet', id), planet);

      context.remove('planet', id).then(function() {
        strictEqual(context.retrieve('planet', id), undefined);
      });
    });
  });
});

test("#remove will asynchronously remove a record when called with a single model instance", function() {
  expect(2);

  Ember.run(function() {
    context.add('planet', {name: 'Earth'}).then(function(planet) {
      var id = planet.get('clientid');
      strictEqual(context.retrieve('planet', id), planet);

      context.remove(planet).then(function() {
        strictEqual(context.retrieve('planet', id), undefined);
      });
    });
  });
});

test("#retrieve can synchronously retrieve a record by id", function() {
  Ember.run(function() {
    context.add('planet', {name: 'Earth'}).then(function(planet) {
      var planet2 = context.retrieve('planet', planet.get('clientid'));
      strictEqual(planet2, planet);
    });
  });
});

test("#retrieve will return undefined if the record does not exist", function() {
  Ember.run(function() {
    var foundPlanet = context.retrieve('planet', 'bogusId');
    strictEqual(foundPlanet, undefined);
  });
});

test("#retrieve can synchronously retrieve all records of a particular type", function() {
  expect(3);

  Ember.run(function() {
    Ember.RSVP.all([
      context.add('planet', {name: 'Earth'}),
      context.add('planet', {name: 'Jupiter'})

    ]).then(function() {
      var planets = context.retrieve('planet');
      equal(planets.length, 2);
      equal(get(planets.objectAt(0), 'name'), 'Earth');
      equal(get(planets.objectAt(1), 'name'), 'Jupiter');
    });
  });
});

test("#all returns a live RecordArray that stays in sync with records of one type", function() {
  expect(4);

  Ember.run(function() {
    var planets = context.all('planet'),
        earth;

    equal(get(planets, 'length'), 0, 'no records have been added yet');

    context.add('planet', {name: 'Earth'}).then(function(planet) {
      earth = planet;
      equal(get(planets, 'length'), 1, 'one record has been added');

    }).then(function() {
      return context.add('planet', {name: 'Jupiter'});

    }).then(function() {
      equal(get(planets, 'length'), 2, 'two records have been added');

    }).then(function() {
      return context.remove(earth);

    }).then(function() {
      equal(get(planets, 'length'), 1, 'one record is left');
    });
  });
});

test("#filter returns a live RecordArray that stays in sync with filtered records of one type", function() {
  expect(15);

  Ember.run(function() {
    var allPlanets = context.filter('planet');

    var terrestrialPlanets = context.filter('planet', function(planet) {
      return get(planet, 'classification') === 'terrestrial';
    });

    var atmosphericPlanets = context.filter('planet', function(planet) {
      return get(planet, 'atmosphere');
    });

    equal(get(allPlanets, 'length'), 0, 'no records have been added yet');
    equal(get(terrestrialPlanets, 'length'), 0, 'no records have been added yet');
    equal(get(atmosphericPlanets, 'length'), 0, 'no records have been added yet');

    Ember.RSVP.all([
      context.add('planet', {name: 'Jupiter', classification: 'gas giant', atmosphere: true}),
      context.add('planet', {name: 'Venus', classification: 'terrestrial', atmosphere: true}),
      context.add('planet', {name: 'Mercury', classification: 'terrestrial', atmosphere: false})

    ]).then(function() {
      equal(get(allPlanets, 'length'), 3, '3 total planets have been added');
      equal(get(terrestrialPlanets, 'length'), 2, '2 terrestrial planets have been added');
      equal(get(atmosphericPlanets, 'length'), 2, '2 atmospheric planets have been added');

      return context.add('planet', {name: 'Earth', classification: 'terrestrial', atmosphere: true});

    }).then(function(earth) {

      equal(get(allPlanets, 'length'), 4, '4 total planets have been added');
      equal(get(terrestrialPlanets, 'length'), 3, '3 terrestrial planets have been added');
      equal(get(atmosphericPlanets, 'length'), 3, '3 atmospheric planets have been added');

      return context.remove('planet', earth);

    }).then(function() {
      equal(get(allPlanets, 'length'), 3, '3 total planets have been added');
      equal(get(terrestrialPlanets, 'length'), 2, '2 terrestrial planets have been added');
      equal(get(atmosphericPlanets, 'length'), 2, '2 atmospheric planets have been added');

      return context.find('planet', {name: 'Jupiter'});

    }).then(function(planetsNamedJupiter) {
      Ember.run(function() {
        set(planetsNamedJupiter[0], 'classification', 'terrestrial'); // let's just pretend :)
      });

    }).then(function() {
      equal(get(allPlanets, 'length'), 3, '3 total planets have been added');
      equal(get(terrestrialPlanets, 'length'), 3, '3 terrestrial planets have been added');
      equal(get(atmosphericPlanets, 'length'), 2, '2 atmospheric planets have been added');
    });
  });
});

test("#then resolves when all transforms have completed", function() {
  expect(2);

  Ember.run(function() {
    context.add('planet', {name: 'Earth'});
    context.add('planet', {name: 'Jupiter'});

    context.then(function() {
      ok(true, 'finished processing transforms');
      equal(get(context.all('planet'), 'length'), 2, 'two records have been added');
    });
  });
});