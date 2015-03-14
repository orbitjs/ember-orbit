import Orbit from 'orbit';
import attr from 'ember-orbit/fields/attr';
import hasOne from 'ember-orbit/fields/has-one';
import hasMany from 'ember-orbit/fields/has-many';
import Store from 'ember-orbit/store';
import Model from 'ember-orbit/model';
import { createStore } from 'tests/test-helper';
import { RecordNotFoundException } from 'orbit-common/lib/exceptions';

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
      planets: hasMany('planet', {inverse: 'sun'}),
      isStable: attr('boolean', {defaultValue: true})
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
  expect(7);

  Ember.run(function() {
    store.add('planet', {name: 'Earth'}).then(function(planet) {
      ok(get(planet, 'id'), 'id has been defined');

      ok(planet.primaryId, 'primaryId has been defined');

      equal(planet.primaryId, get(planet, 'id'), 'id matches primaryId');

      equal(get(planet, 'name'), 'Earth');

      set(planet, 'name', 'Jupiter');

      equal(get(planet, 'name'), 'Jupiter', 'CP reflects transformed value');

      equal(store.orbitSource.retrieve(['planet', planet.primaryId, 'name']),
            'Earth',
            'memory source patch is not yet complete');

      store.then(function() {
        equal(store.orbitSource.retrieve(['planet', planet.primaryId, 'name']),
              'Jupiter',
              'memory source patch is now complete');
      });
    });
  });
});

test("new models will be assigned default values for attributes", function(){
  expect(1);

  Ember.run(function() {
    store.add('star', {}).then(function(star) {
      equal(get(star, 'isStable'), true, 'default value has been assigned');
    });
  });
});

test("new models can be added with has-one links", function() {
  expect(4);

  Ember.run(function() {
    var jupiter,
        io,
        europa;

    store.add('planet', {name: 'Jupiter'}).then(function(planet) {
      jupiter = planet;

    }).then(function() {
      return store.add('moon', {name: 'Io', planet: jupiter}).then(function(moon) {
        io = moon;
      });

    }).then(function() {
      equal(get(io, 'planet.content'), jupiter, 'Io has been assigned a planet');
      equal(get(io, 'planet.name'), 'Jupiter', 'Io\'s planet is named Jupiter');

      equal(get(jupiter, 'moons.length'), 1, 'Jupiter now has one moon');
      equal(get(jupiter, 'moons.firstObject'), io, 'Io has been added to Jupiter\'s moons');
    });
  });
});

test("new models can be added with has-many links", function() {
  expect(4);

  Ember.run(function() {
    var jupiter,
        io,
        europa;

    store.add('moon', {name: 'Io'}).then(function(moon) {
      io = moon;

    }).then(function() {
      return store.add('planet', {name: 'Jupiter', moons: [io]}).then(function(planet) {
        jupiter = planet;
      });

    }).then(function() {
      equal(get(io, 'planet.content'), jupiter, 'Io has been assigned a planet');
      equal(get(io, 'planet.name'), 'Jupiter', 'Io\'s planet is named Jupiter');

      equal(get(jupiter, 'moons.length'), 1, 'Jupiter now has one moon');
      equal(get(jupiter, 'moons.firstObject'), io, 'Io has been added to Jupiter\'s moons');
    });
  });
});

test("hasOne relationships can be added, updated and removed", function() {
  expect(9);

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
      equal(get(io, 'planet.content'), null, 'Io has not been assigned a planet');
      equal(get(io, 'planet.name'), null, 'Io\'s planet does not yet have a name');

      set(io, 'planet', jupiter);

      equal(get(io, 'planet.content'), jupiter, 'Io has been assigned a planet');
      equal(get(io, 'planet.name'), 'Jupiter', 'Io\'s planet is named Jupiter');

      // Check internals of source
      equal(store.orbitSource.retrieve(['moon', io.primaryId, '__rel', 'planet']),
        undefined,
        'memory source patch is not yet complete');

      return store.settleTransforms();

    }).then(function() {
      // Check internals of source
      equal(store.orbitSource.retrieve(['moon', io.primaryId, '__rel', 'planet']),
            jupiter.primaryId,
            'memory source patch is now complete');

      set(io, 'planet', undefined);

      equal(get(io, 'planet.content'), undefined, 'Io has not been assigned a planet');
      equal(get(io, 'planet.name'), undefined, 'Io\'s planet does not yet have a name');

      return store.settleTransforms();

    }).then(function() {
      // Check internals of source
      equal(store.orbitSource.retrieve(['moon', io.primaryId, '__rel', 'planet']),
            null,
            'memory source has been reset');
    });
  });
});

test("hasOne relationships can be reloaded and return a record", function() {
 expect(2);

 Ember.run(function() {
   var jupiter,
       io,
       europa;

   store.add('planet', {id: '123', name: 'Jupiter'}).then(function(planet) {
     jupiter = planet;

   }).then(function() {
     return store.add('moon', {name: 'Io', planet: jupiter});

   }).then(function(moon) {
     io = moon;
     return get(io, 'planet').reload();

   }).then(function(planet) {
     strictEqual(planet, jupiter, 'planet is looked up correctly');
     strictEqual(get(io, 'planet.content'), jupiter, 'planet has been set correctly in object proxy');
   });
 });
});

test("hasOne relationships can be reloaded and return null", function() {
 expect(1);

 Ember.run(function() {
   var jupiter,
       io,
       europa;

   store.add('planet', {id: '123', name: 'Jupiter'}).then(function(planet) {
     jupiter = planet;

   }).then(function() {
     return store.add('moon', {name: 'Io'});

   }).then(function(moon) {
     io = moon;
     return get(io, 'planet').reload();

   }).then(function(planet) {
     equal(planet, null, 'planet can not be found.');
   });
 });
});

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

      equal(store.orbitSource.retrieve(['moon', io.primaryId, '__rel', 'planet']),
            undefined,
            'memory source patch is not yet complete');

      store.then(function() {
        equal(store.orbitSource.retrieve(['moon', io.primaryId, '__rel', 'planet']),
              jupiter.primaryId,
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
  expect(2);

  Ember.run(function() {
    store.add('planet', {name: 'Earth'}).then(function(planet) {
      equal(get(planet, 'name'), 'Earth');

      store.transform({
        op: 'replace',
        path: ['planet', planet.primaryId, 'name'],
        value: 'Jupiter'
      }).then(function() {
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
