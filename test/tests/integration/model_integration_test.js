import Orbit from 'orbit';
import attr from 'ember_orbit/attr';
import hasOne from 'ember_orbit/relationships/has_one';
import hasMany from 'ember_orbit/relationships/has_many';
import Store from 'ember_orbit/store';
import Model from 'ember_orbit/model';
import { createStore } from 'test_helper';
import { RecordNotFoundException } from 'orbit_common/lib/exceptions';

var get = Ember.get,
    set = Ember.set;

var Planet,
    Moon,
    Star,
    store;

module("Integration - Model", {
  setup: function() {
    Orbit.Promise = Ember.RSVP.Promise;

    Star = Model.extend({
      name: attr('string'),
      planets: hasMany('planet', {inverse: 'sun'})
    });

    Moon = Model.extend({
      name: attr('string'),
      planet: hasOne('planet', {inverse: 'moons'})
    });

    Planet = Model.extend({
      name: attr('string'),
      classification: attr('string'),
      sun: hasOne('star', {inverse: 'planets'}),
      moons: hasMany('moon', {inverse: 'planet'})
    });

    store = createStore({
      models: {
        star: Star,
        moon: Moon,
        planet: Planet
      }
    });
  },

  teardown: function() {
    Orbit.Promise = null;
    Star = null;
    Moon = null;
    Planet = null;
    store = null;
  }
});

test("store exists", function() {
  ok(store);
});

test("store is properly linked to models", function() {
  var schema = get(store, 'schema');
  equal(schema.modelFor('star'), Star);
  equal(schema.modelFor('planet'), Planet);
  equal(schema.modelFor('moon'), Moon);
});

test("new models can be created and updated", function() {
  expect(4);

  Ember.run(function() {
    store.add('planet', {name: 'Earth'}).then(function(planet) {
      equal(get(planet, 'name'), 'Earth');

      set(planet, 'name', 'Jupiter');

      equal(get(planet, 'name'), 'Jupiter', 'CP reflects transformed value');

      equal(store.orbitSource.retrieve(['planet', get(planet, 'clientid'), 'name']),
            'Earth',
            'memory source patch is not yet complete');

      store.then(function() {
        equal(store.orbitSource.retrieve(['planet', get(planet, 'clientid'), 'name']),
              'Jupiter',
              'memory source patch is now complete');
      });
    });
  });
});

test("hasOne relationships can be created and updated", function() {
  expect(6);

  Ember.run(function() {
    var jupiter,
        io,
        europa;

    store.add('planet', {name: 'Jupiter'}).then(function(planet) {
      jupiter = planet;

    }).then(function() {
      return store.add('moon', {name: 'Io'}).then(function(moon) {
        io = moon;
      });

    }).then(function() {
      return store.add('moon', {name: 'Europa'}).then(function (moon) {
        europa = moon;
      });

    }).then(function() {
      equal(get(io, 'planet.content'), null, 'Io has not been assigned a planet');
      equal(get(io, 'planet.name'), null, 'Io\'s planet does not yet have a name');

      set(io, 'planet', jupiter);

      equal(get(io, 'planet.content'), jupiter, 'Io has been assigned a planet');
      equal(get(io, 'planet.name'), 'Jupiter', 'Io\'s planet is named Jupiter');

      // Check internals of source
      equal(store.orbitSource.retrieve(['moon', get(io, 'clientid'), '__rel', 'planet']),
            undefined,
            'memory source patch is not yet complete');

      store.then(function() {
        // Check internals of source
        equal(store.orbitSource.retrieve(['moon', get(io, 'clientid'), '__rel', 'planet']),
              get(jupiter, 'clientid'),
              'memory source patch is now complete');
      });
    });
  });
});

// TODO
//test("hasOne relationships can trigger a `find` based on the relatedId", function() {
//  expect(2);
//
//  Ember.run(function() {
//    var jupiter,
//        io,
//        europa;
//
//    store.add('planet', {id: '123', name: 'Jupiter'}).then(function(planet) {
//      jupiter = planet;
//
//    }).then(function() {
//      return store.add('moon', {name: 'Io', links: {planet: jupiter}});
//
//    }).then(function(moon) {
//      io = moon;
//      return get(io, 'planet').find();
//
//    }).then(function(planet) {
//      strictEqual(planet, jupiter, 'planet is looked up correctly');
//      strictEqual(get(io, 'planet.content'), jupiter, 'planet has been set correctly in object proxy');
//    });
//  });
//});
//
//test("hasOne relationships can fail to find a record based on the relatedId", function() {
//  expect(1);
//
//  Ember.run(function() {
//    var jupiter,
//        io,
//        europa;
//
//    store.add('planet', {id: '123', name: 'Jupiter'}).then(function(planet) {
//      jupiter = planet;
//
//    }).then(function() {
//      return store.add('moon', {name: 'Io', links: {planet: {id: 'bogus'}}});
//
//    }).then(function(moon) {
//      io = moon;
//      return get(io, 'planet').find();
//
//    }).then(function(planet) {
//      ok(false, 'should not be able to find record based on a fake id');
//
//    }, function(e) {
//      ok(e instanceof RecordNotFoundException, 'RecordNotFoundException thrown');
//    });
//  });
//});

test("hasMany relationships can be created and updated", function() {
  expect(8);

  Ember.run(function() {
    var jupiter,
        io,
        europa,
        moons;

    store.add('planet', {name: 'Jupiter'}).then(function(planet) {
      jupiter = planet;

    }).then(function() {
      return store.add('moon', {name: 'Io'}).then(function(moon) {
        io = moon;
      });

    }).then(function() {
      return store.add('moon', {name: 'Europa'}).then(function(moon) {
        europa = moon;
      });

    }).then(function() {

      moons = get(jupiter, 'moons');

      equal(get(moons, 'length'), 0, 'No moons have been assigned yet');

      equal(get(io, 'planet.content'), null, 'Io has not been assigned a planet');

      set(io, 'planet', jupiter);

      equal(get(io, 'planet.content'), jupiter, 'Io has been assigned a planet');

      equal(store.orbitSource.retrieve(['moon', get(io, 'clientid'), '__rel', 'planet']),
            undefined,
            'memory source patch is not yet complete');

      store.then(function() {
        equal(store.orbitSource.retrieve(['moon', get(io, 'clientid'), '__rel', 'planet']),
              get(jupiter, 'clientid'),
              'memory source patch is now complete');

        strictEqual(get(jupiter, 'moons'), moons, 'ManyArray is still the same object');

        strictEqual(get(jupiter, 'moons.content'), get(moons, 'content'), 'ManyArray content is still the same');

        equal(get(moons, 'length'), 1, 'Jupiter has one moon');
      });

    });
  });
});

test("hasMany arrays are updated when related records are removed", function() {
  expect(4);

  Ember.run(function() {
    var jupiter,
        io,
        europa,
        moons;

    store.add('planet', {name: 'Jupiter'}).then(function(planet) {
      jupiter = planet;

    }).then(function() {
      return store.add('moon', {name: 'Io'}).then(function(moon) {
        io = moon;
      });

    }).then(function() {
      return store.add('moon', {name: 'Europa'}).then(function(moon) {
        europa = moon;
      });

    }).then(function() {

      moons = get(jupiter, 'moons');

      equal(get(moons, 'length'), 0, 'No moons have been assigned yet');

      set(io, 'planet', jupiter);
      set(europa, 'planet', jupiter);

      store.then(function() {
        equal(get(moons, 'length'), 2, 'Jupiter has two moons');
        return io.remove();

      }).then(function() {
        equal(get(moons, 'length'), 1, 'Jupiter has one moon');
        equal(get(moons, 'firstObject'), europa, 'That moon is Europa');
      });
    });
  });
});

test("hasMany relationships are updated when a HasManyArray is updated", function() {
  expect(4);

  Ember.run(function() {
    var jupiter,
        io,
        europa,
        moons;

    store.add('planet', {name: 'Jupiter'}).then(function(planet) {
      jupiter = planet;

    }).then(function() {
      return store.add('moon', {name: 'Io'}).then(function(moon) {
        io = moon;
      });

    }).then(function() {
      return store.add('moon', {name: 'Europa'}).then(function(moon) {
        europa = moon;
      });

    }).then(function() {

      moons = get(jupiter, 'moons');

      equal(get(moons, 'length'), 0, 'No moons have been assigned yet');

      moons.addObject(io);
      moons.addObject(europa);

      store.then(function() {
        equal(get(moons, 'length'), 2, 'Jupiter has two moons');

        strictEqual(get(io, 'planet.content'), jupiter, 'Jupiter has been assigned to IO');
        strictEqual(get(europa, 'planet.content'), jupiter, 'Jupiter has been assigned to Europa');
      });
    });
  });
});

test("model properties can be reset through transforms", function() {
  expect(3);

  Ember.run(function() {
    store.add('planet', {name: 'Earth'}).then(function(planet) {
      equal(get(planet, 'name'), 'Earth');

      store.transform({
        op: 'replace',
        path: ['planet', get(planet, 'clientid'), 'name'],
        value: 'Jupiter'
      });

      equal(get(planet, 'name'), 'Earth', 'CP has not been invalidated yet');

      store.then(function() {
        equal(get(planet, 'name'), 'Jupiter', 'CP reflects transformed value');
      });
    });
  });
});

test("models can be deleted", function() {
  expect(3);

  Ember.run(function() {
    var planets = store.all('planet');

    equal(get(planets, 'length'), 0, 'no records have been added yet');

    store.add('planet', {name: 'Earth'}).then(function(planet) {

      equal(get(planets, 'length'), 1, 'record has been added');

      planet.remove().then(function() {
        equal(get(planets, 'length'), 0, 'record has been removed');
      });
    });
  });
});
