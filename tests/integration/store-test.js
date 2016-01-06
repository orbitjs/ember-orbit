import { dummyModels } from 'dummy/tests/support/dummy-models';
import { createStore } from 'dummy/tests/support/store';

const { Planet, Moon, Star } = dummyModels;
const { get } = Ember;

module('Integration - Store', function(hooks) {
  let store;

  hooks.beforeEach(function() {
    const models = { planet: Planet, moon: Moon, star: Star };
    store = createStore({ models });
  });

  hooks.afterEach(function() {
    store = null;
  });

  test('#addRecord', function(assert) {
    Ember.run(() => {
      store
        .addRecord({ type: 'planet', name: 'Earth' })
        .then(function(planet) {
           assert.ok(planet instanceof Planet);
           assert.ok(get(planet, 'id'), 'assigned id');
           assert.equal(get(planet, 'name'), 'Earth');
        });
    });
  });

  test('#findRecord', function(assert) {
    Ember.run(() => {
      store
        .addRecord({ type: 'planet', name: 'Earth' })
        .then( record => store.findRecord('planet', record.get('id')))
        .then( planet => {
          assert.ok(planet instanceof Planet);
          assert.ok(get(planet, 'id'), 'assigned id');
          assert.equal(get(planet, 'name'), 'Earth');
        });
    });
  });

  test('#removeRecord', function(assert) {
    Ember.run(() => {
      store
        .addRecord({ type: 'planet', name: 'Earth' })
        .then(record => {
          store
            .removeRecord(record)
            .then(() => store.findRecord('planet', record.get('id')))
            .then(planet => assert.ok(!planet, 'removed planet'));
        });
    });
  });

  test('#replaceAttribute', function(assert) {
    Ember.run(() => {
      store
        .addRecord({ type: 'planet', name: 'Earth' })
        .then(record => {
          store
            .replaceAttribute(record, 'name', 'Jupiter')
            .then(() => assert.equal(record.get('name'), 'Jupiter'));
        });
    });
  });

  test('#addToHasMany', function(assert) {
    Ember.run(() => {
      const done = assert.async();

      Ember.RSVP.Promise.all([
        store.addRecord({type: 'planet', name: 'Jupiter'}),
        store.addRecord({type: 'moon', name: 'Callisto'})
      ])
      .then(([jupiter, callisto]) => {
        store
          .addToHasMany(jupiter, 'moons', callisto)
          .then(() => {
            assert.ok(jupiter.get('moons').contains(callisto), 'added record to hasMany');
            assert.equal(callisto.get('planet'), jupiter, 'updated inverse');
            done();
          });
      });
    });
  });

  test('#removeFromHasMany', function(assert) {
    Ember.run(() => {
      const done = assert.async();

      Ember.RSVP.Promise.all([
        store.addRecord({type: 'planet', name: 'Jupiter'}),
        store.addRecord({type: 'moon', name: 'Callisto'})
      ])
      .tap(([jupiter, callisto]) => store.addToHasMany(jupiter, 'moons', callisto))
      .then(([jupiter, callisto]) => {
        store
          .removeFromHasMany(jupiter, 'moons', callisto)
          .then(() => {
            assert.ok(!jupiter.get('moons').contains(callisto), 'removed record from hasMany');
            assert.ok(!callisto.get('planet'), 'updated inverse');
            done();
          });
      });
    });
  });

  test('#replaceHasOne - with record', function(assert) {
    Ember.run(() => {
      const done = assert.async();

      Ember.RSVP.Promise.all([
        store.addRecord({type: 'planet', name: 'Jupiter'}),
        store.addRecord({type: 'moon', name: 'Callisto'})
      ])
      .then(([jupiter, callisto]) => {
        store
          .replaceHasOne(callisto, 'planet', jupiter)
          .then(() => {
            assert.equal(callisto.get('planet'), jupiter, 'replaced hasOne with record');
            assert.ok(jupiter.get('moons').contains(callisto), 'updated inverse');
            done();
          });
      });
    });
  });

  test('#replaceHasOne with null', function(assert) {
    Ember.run(() => {
      const done = assert.async();

      Ember.RSVP.Promise.all([
        store.addRecord({type: 'planet', name: 'Jupiter'}),
        store.addRecord({type: 'moon', name: 'Callisto'})
      ])
      .tap(([jupiter, callisto]) => store.replaceHasOne(callisto, 'planet', jupiter))
      .tap(([jupiter, callisto]) => store.replaceHasOne(callisto, 'planet', null))
      .then(([jupiter, callisto]) => {
        assert.equal(callisto.get('planet'), null, 'replaced hasOne with null');
        assert.ok(!jupiter.get('moons').contains(callisto), 'removed from inverse hasMany');
        done();
      });
    });
  });
});
