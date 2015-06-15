import Orbit from 'orbit';
import OCLocalStorageSource from 'orbit-common/local-storage-source';
import { RecordNotFoundException } from 'orbit-common/lib/exceptions';
import attr from 'ember-orbit/fields/attr';
import hasOne from 'ember-orbit/fields/has-one';
import hasMany from 'ember-orbit/fields/has-many';
import Store from 'ember-orbit/store';
import Model from 'ember-orbit/model';
import Schema from 'ember-orbit/schema';
import { createStore } from 'tests/test-helper';

var get = Ember.get,
    set = Ember.set;

var Planet,
    Moon,
    Star,
    store;

module("Unit - Store", {
  setup: function() {
    Orbit.Promise = Ember.RSVP.Promise;

    Planet = Model.extend({
      name: attr('string'),
      atmosphere: attr('boolean'),
      classification: attr('string'),
      sun: hasOne('star'),
      moons: hasMany('moon')
    });

    Moon = Model.extend({
      name: attr('string'),
      planet: hasOne('planet')
    });

    Star = Model.extend({
      name: attr('string'),
      planets: hasMany('planet')
    });

    store = createStore({
      models: {
        planet: Planet,
        moon: Moon,
        star: Star
      }
    });
  },

  teardown: function() {
    Orbit.Promise = null;
    Planet = null;
    Moon = null;
    Star = null;
    store = null;
  }
});

test("it exists", function() {
  ok(store);
});

test("it can specify a custom `orbitSourceClass` and `orbitSourceOptions`", function() {
  expect(3);

  var CustomStore = Store.extend({
    orbitSourceClass: OCLocalStorageSource,
    orbitSourceOptions: {
      namespace: 'custom'
    }
  });

  var customStore = CustomStore.create({
    container: new Ember.Registry().container(),
    schema: Schema.create()
  });

  ok(customStore, 'custom store exists');
  ok(customStore.orbitSource instanceof OCLocalStorageSource, 'custom store has the right type of `orbitSource`');
  equal(customStore.orbitSource.namespace, 'custom', 'custom store has the right custom namespace');
});

test("it uses a schema that's been specified", function() {
  var schema2 = Schema.create(),
      store2 = Store.create({schema: schema2});
  strictEqual(store2.schema, schema2, "schema matches one that was specified");
});

test("it creates a schema if none has been specified", function() {
  var registry = new Ember.Registry();
  var container = registry.container();
  registry.register('schema:main', Schema);

  var store2 = Store.create({container: container});
  var schema2 = get(store2, 'schema');
  ok(schema2, "schema has been created");
  ok(schema2 instanceof Schema, "schema is a `Schema`");
});

test("#add will add a new instance of a model", function() {
  Ember.run(function() {
    store.add('planet', {name: 'Earth'}).then(function(planet) {
      ok(planet instanceof Planet);
      ok(get(planet, 'primaryId'), 'assigned primaryId');
      equal(get(planet, 'name'), 'Earth');
    });
  });
});

test("#find will asynchronously return a record when called with a `type` and a single `id`", function() {
  Ember.run(function() {
    store.add('planet', {name: 'Earth'}).then(function(planet) {
      store.find('planet', get(planet, 'primaryId')).then(function(foundPlanet) {
        strictEqual(foundPlanet, planet);
      });
    });
  });
});

test("#find will asynchronously fail if a record can't be found", function() {
  Ember.run(function() {
    store.add('planet', {name: 'Earth'}).then(function() {
      store.find('planet', 'bogus').then(function() {
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

    store.add('planet', {name: 'Earth'}).then(function(planet) {
      planets.push(planet);
      ids.push(get(planet, 'primaryId'));
      return store.add('planet', {name: 'Jupiter'});

    }).then(function(planet) {
      planets.push(planet);
      ids.push(get(planet, 'primaryId'));

    }).then(function() {
      store.find('planet', ids).then(function(foundPlanets) {
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

    store.add('planet', {name: 'Earth'}).then(function(planet) {
      planets.push(planet);
      ids.push(get(planet, 'primaryId'));
      return store.add('planet', {name: 'Jupiter'});

    }).then(function(planet) {
      planets.push(planet);
      ids.push(get(planet, 'primaryId'));

    }).then(function() {
      store.find('planet').then(function(foundPlanets) {
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

    store.add('planet', {name: 'Earth'}).then(function(planet) {
      planets.push(planet);
      ids.push(get(planet, 'primaryId'));
      return store.add('planet', {name: 'Jupiter'});

    }).then(function(planet) {
      planets.push(planet);
      ids.push(get(planet, 'primaryId'));

    }).then(function() {
      store.find('planet', {name: 'Jupiter'}).then(function(foundPlanets) {
        equal(foundPlanets.length, 1, 'only one planet is named "Jupiter"');

        strictEqual(foundPlanets[0], planets[1], 'found planet matches created planet');
      });
    });
  });
});

test("#remove will asynchronously remove a record when called with a `type` and a single `id`", function() {
  expect(2);

  Ember.run(function() {
    store.add('planet', {name: 'Earth'}).then(function(planet) {
      var id = get(planet, 'primaryId');

      strictEqual(store.retrieve('planet', id), planet);

      store.remove('planet', id).then(function() {
        strictEqual(store.retrieve('planet', id), undefined);
      });
    });
  });
});

test("#remove will asynchronously remove a record when called with a single model instance", function() {
  expect(2);

  Ember.run(function() {
    store.add('planet', {name: 'Earth'}).then(function(planet) {
      var id = get(planet, 'primaryId');
      strictEqual(store.retrieve('planet', id), planet);

      planet.remove().then(function() {
        strictEqual(store.retrieve('planet', id), undefined);
      });
    });
  });
});

test("#remove operation on source will trigger Model didUnload event", function() {
  expect(1);

  Ember.run(function() {
    store.add('planet', {name: 'Earth'})
      .then(function(planet) {
        var id = get(planet, 'primaryId');

        planet.on('didUnload', function() {
          ok(true, 'didUnload fired');
        });

        store.orbitSource.remove('planet', id);
      });
  });
});


test("#retrieve can synchronously retrieve a record by id", function() {
  Ember.run(function() {
    store.add('planet', {name: 'Earth'}).then(function(planet) {
      var planet2 = store.retrieve('planet', get(planet, 'primaryId'));
      strictEqual(planet2, planet);
    });
  });
});

test("#retrieve will return undefined if the record does not exist", function() {
  Ember.run(function() {
    var foundPlanet = store.retrieve('planet', 'bogusId');
    strictEqual(foundPlanet, undefined);
  });
});

test("#retrieve can synchronously retrieve all records of a particular type", function() {
  expect(3);

  Ember.run(function() {
    Ember.RSVP.all([
      store.add('planet', {name: 'Earth'}),
      store.add('planet', {name: 'Jupiter'})

    ]).then(function() {
      var planets = Ember.A(store.retrieve('planet'));
      equal(planets.length, 2);
      equal(get(planets.objectAt(0), 'name'), 'Earth');
      equal(get(planets.objectAt(1), 'name'), 'Jupiter');
    });
  });
});

test("#all returns a live RecordArray that stays in sync with records of one type", function() {
  expect(4);

  Ember.run(function() {
    var planets = store.all('planet'),
        earth;

    equal(get(planets, 'length'), 0, 'no records have been added yet');

    store.add('planet', {name: 'Earth'}).then(function(planet) {
      earth = planet;
      equal(get(planets, 'length'), 1, 'one record has been added');

    }).then(function() {
      return store.add('planet', {name: 'Jupiter'});

    }).then(function() {
      equal(get(planets, 'length'), 2, 'two records have been added');

    }).then(function() {
      return earth.remove();

    }).then(function() {
      equal(get(planets, 'length'), 1, 'one record is left');
    });
  });
});

test("#filter returns a live RecordArray that stays in sync with filtered records of one type", function() {
  expect(15);

  Ember.run(function() {
    var allPlanets = store.filter('planet');

    var terrestrialPlanets = store.filter('planet', function(planet) {
      return get(planet, 'classification') === 'terrestrial';
    });

    var atmosphericPlanets = store.filter('planet', function(planet) {
      return get(planet, 'atmosphere');
    });

    equal(get(allPlanets, 'length'), 0, 'no records have been added yet');
    equal(get(terrestrialPlanets, 'length'), 0, 'no records have been added yet');
    equal(get(atmosphericPlanets, 'length'), 0, 'no records have been added yet');

    Ember.RSVP.all([
      store.add('planet', {name: 'Jupiter', classification: 'gas giant', atmosphere: true}),
      store.add('planet', {name: 'Venus', classification: 'terrestrial', atmosphere: true}),
      store.add('planet', {name: 'Mercury', classification: 'terrestrial', atmosphere: false})

    ]).then(function() {
      equal(get(allPlanets, 'length'), 3, '3 total planets have been added');
      equal(get(terrestrialPlanets, 'length'), 2, '2 terrestrial planets have been added');
      equal(get(atmosphericPlanets, 'length'), 2, '2 atmospheric planets have been added');

      return store.add('planet', {name: 'Earth', classification: 'terrestrial', atmosphere: true});

    }).then(function(earth) {

      equal(get(allPlanets, 'length'), 4, '4 total planets have been added');
      equal(get(terrestrialPlanets, 'length'), 3, '3 terrestrial planets have been added');
      equal(get(atmosphericPlanets, 'length'), 3, '3 atmospheric planets have been added');

      return store.remove('planet', earth);

    }).then(function() {
      equal(get(allPlanets, 'length'), 3, '3 total planets have been added');
      equal(get(terrestrialPlanets, 'length'), 2, '2 terrestrial planets have been added');
      equal(get(atmosphericPlanets, 'length'), 2, '2 atmospheric planets have been added');

      return store.find('planet', {name: 'Jupiter'});

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

test("#filter can be passed a query object for `find` and the resulting live RecordArray will stay in sync with a filter function", function() {
  expect(13);

  Ember.run(function() {
    var allPlanets = store.all('planet'),
        terrestrialPlanets,
        atmosphericPlanets;

    equal(get(allPlanets, 'length'), 0, 'no records have been added yet');

    Ember.RSVP.all([
      store.add('planet', {name: 'Jupiter', classification: 'gas giant', atmosphere: true}),
      store.add('planet', {name: 'Venus', classification: 'terrestrial', atmosphere: true}),
      store.add('planet', {name: 'Mercury', classification: 'terrestrial', atmosphere: false})

    ]).then(function() {
      terrestrialPlanets = store.filter('planet', {classification: 'sadf'}, function (planet) {
        return get(planet, 'classification') === 'terrestrial';
      });

      atmosphericPlanets = store.filter('planet', {atmosphere: true}, function (planet) {
        return get(planet, 'atmosphere');
      });

      // `find` calls that are triggered by `filter` need to be resolved before checking results
      return Ember.RSVP.all([terrestrialPlanets, atmosphericPlanets]);

    }).then(function() {

      equal(get(allPlanets, 'length'), 3, '3 total planets have been added');
      equal(get(terrestrialPlanets, 'length'), 2, '2 terrestrial planets have been added');
      equal(get(atmosphericPlanets, 'length'), 2, '2 atmospheric planets have been added');

      return store.add('planet', {name: 'Earth', classification: 'terrestrial', atmosphere: true});

    }).then(function(earth) {

      equal(get(allPlanets, 'length'), 4, '4 total planets have been added');
      equal(get(terrestrialPlanets, 'length'), 3, '3 terrestrial planets have been added');
      equal(get(atmosphericPlanets, 'length'), 3, '3 atmospheric planets have been added');

      return store.remove('planet', earth);

    }).then(function() {
      equal(get(allPlanets, 'length'), 3, '3 total planets have been added');
      equal(get(terrestrialPlanets, 'length'), 2, '2 terrestrial planets have been added');
      equal(get(atmosphericPlanets, 'length'), 2, '2 atmospheric planets have been added');

      return store.find('planet', {name: 'Jupiter'});

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
    store.add('planet', {name: 'Earth'});
    store.add('planet', {name: 'Jupiter'});

    store.then(function() {
      ok(true, 'finished processing transforms');
      equal(get(store.all('planet'), 'length'), 2, 'two records have been added');
    });
  });
});
