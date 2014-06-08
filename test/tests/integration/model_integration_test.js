import Orbit from 'orbit';
import attr from 'ember_orbit/attr';
import hasOne from 'ember_orbit/relationships/has_one';
import hasMany from 'ember_orbit/relationships/has_many';
import Context from 'ember_orbit/context';
import Store from 'ember_orbit/store';
import Model from 'ember_orbit/model';
import { createStore } from 'test_helper';
import { RecordNotFoundException } from 'orbit_common/lib/exceptions';

var get = Ember.get,
    set = Ember.set;

var Planet,
    Moon,
    Star,
    store,
    context;

module("Integration - Model", {
  setup: function() {
    Orbit.Promise = Ember.RSVP.Promise;

    Star = Model.extend({
      name: attr('string'),
      planets: hasMany('planet', {inverse: 'star'})
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

    context = Context.create({
      store: store
    });
  },

  teardown: function() {
    Orbit.Promise = null;
    Star = null;
    Moon = null;
    Planet = null;
    store = null;
    context = null;
  }
});

test("store exists", function() {
  ok(store);
});

test("store is properly linked to models", function() {
  equal(store.modelFor('star'), Star);
  equal(store.modelFor('planet'), Planet);
  equal(store.modelFor('moon'), Moon);
});

test("new models can be created and updated", function() {
  expect(4);

  Ember.run(function() {
    context.add('planet', {name: 'Earth'}).then(function(planet) {
      equal(get(planet, 'name'), 'Earth');

      set(planet, 'name', 'Jupiter');

      equal(get(planet, 'name'), 'Jupiter', 'CP reflects transformed value');

      equal(context._source.retrieve(['planet', get(planet, 'clientid'), 'name']),
            'Earth',
            'memory source patch is not yet complete');

      context.then(function() {
        equal(context._source.retrieve(['planet', get(planet, 'clientid'), 'name']),
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

    context.add('planet', {name: 'Jupiter'}).then(function(planet) {
      jupiter = planet;

    }).then(function() {
      return context.add('moon', {name: 'Io'}).then(function(moon) {
        io = moon;
      });

    }).then(function() {
      return context.add('moon', {name: 'Europa'}).then(function (moon) {
        europa = moon;
      });

    }).then(function() {
      equal(get(io, 'planet.content'), null, 'Io has not been assigned a planet');
      equal(get(io, 'planet.name'), null, 'Io\'s planet does not yet have a name');

      set(io, 'planet', jupiter);

      equal(get(io, 'planet.content'), jupiter, 'Io has been assigned a planet');
      equal(get(io, 'planet.name'), 'Jupiter', 'Io\'s planet is named Jupiter');

      equal(context._source.retrieve(['moon', get(io, 'clientid'), 'links', 'planet']),
            undefined,
            'memory source patch is not yet complete');

      context.then(function() {
        equal(context._source.retrieve(['moon', get(io, 'clientid'), 'links', 'planet']),
              get(jupiter, 'clientid'),
              'memory source patch is now complete');
      });
    });
  });
});

test("hasOne relationships can trigger a `find` based on the relatedId", function() {
  expect(1);

  Ember.run(function() {
    var jupiter,
        io,
        europa;

    context.add('planet', {id: '123', name: 'Jupiter'}).then(function(planet) {
      jupiter = planet;

    }).then(function() {
      return context.add('moon', {name: 'Io', links: {planet: {id: '123'}}});

    }).then(function(moon) {
      io = moon;
      return get(io, 'planet');

    }).then(function(planet) {
      strictEqual(planet, jupiter, 'planet is looked up correctly');
    });
  });
});

test("hasOne relationships can fail to find a record based on the relatedId", function() {
  expect(1);

  Ember.run(function() {
    var jupiter,
        io,
        europa;

    context.add('planet', {id: '123', name: 'Jupiter'}).then(function(planet) {
      jupiter = planet;

    }).then(function() {
      return context.add('moon', {name: 'Io', links: {planet: {id: 'bogus'}}});

    }).then(function(moon) {
      io = moon;
      return get(io, 'planet');

    }).then(function(planet) {
      ok(false, 'should not be able to find record based on a fake id');

    }, function(e) {
      ok(e instanceof RecordNotFoundException, 'RecordNotFoundException thrown');
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

    context.add('planet', {name: 'Jupiter'}).then(function(planet) {
      jupiter = planet;

    }).then(function() {
      return context.add('moon', {name: 'Io'}).then(function(moon) {
        io = moon;
      });

    }).then(function() {
      return context.add('moon', {name: 'Europa'}).then(function(moon) {
        europa = moon;
      });

    }).then(function() {

      moons = get(jupiter, 'moons');

      equal(get(moons, 'length'), 0, 'No moons have been assigned yet');

      equal(get(io, 'planet.content'), null, 'Io has not been assigned a planet');

      set(io, 'planet', jupiter);

      equal(get(io, 'planet.content'), jupiter, 'Io has been assigned a planet');

      equal(context._source.retrieve(['moon', get(io, 'clientid'), 'links', 'planet']),
            undefined,
            'memory source patch is not yet complete');

      moons.then(function() {
        equal(context._source.retrieve(['moon', get(io, 'clientid'), 'links', 'planet']),
              get(jupiter, 'clientid'),
              'memory source patch is now complete');

        strictEqual(get(jupiter, 'moons'), moons, 'ManyArray is still the same object');

        strictEqual(get(jupiter, 'moons.content'), get(moons, 'content'), 'ManyArray content is still the same');

        equal(get(moons, 'length'), 1, 'Jupiter has one moon');
      });

    });
  });
});

test("model properties can be reset through transforms", function() {
  expect(3);

  Ember.run(function() {
    context.add('planet', {name: 'Earth'}).then(function(planet) {
      equal(get(planet, 'name'), 'Earth');

      context.transform({
        op: 'replace',
        path: ['planet', get(planet, 'clientid'), 'name'],
        value: 'Jupiter'
      });

      equal(get(planet, 'name'), 'Earth', 'CP has not been invalidated yet');

      context.then(function() {
        equal(get(planet, 'name'), 'Jupiter', 'CP reflects transformed value');
      });
    });
  });
});

test("models can be deleted", function() {
  expect(3);

  Ember.run(function() {
    var planets = context.all('planet');

    equal(get(planets, 'length'), 0, 'no records have been added yet');

    context.add('planet', {name: 'Earth'}).then(function(planet) {

      equal(get(planets, 'length'), 1, 'record has been added');

      context.remove(planet).then(function() {
        equal(get(planets, 'length'), 0, 'record has been removed');
      });
    });
  });
});
