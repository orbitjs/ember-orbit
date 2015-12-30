import {
  dummyModels,
  createStore
} from 'tests/test-helper';

import { Promise } from 'rsvp';
const { Planet, Moon, Star } = dummyModels;

module('Integration - Model', function(hooks) {
  let store;

  hooks.beforeEach(function() {
    const models = { planet: Planet, moon: Moon, star: Star };
    store = createStore({ models });
  });

  hooks.afterEach(function() {
    store = null;
  });

  test('add new model', function(assert) {
    Ember.run(() => {
      const done = assert.async();

      Promise.all([
        store.addRecord({type: 'star', name: 'The Sun'}),
        store.addRecord({type: 'moon', name: 'Callisto'}),
      ])
      .then(([theSun, callisto]) => {
        store
          .addRecord({type: 'planet', name: 'Jupiter', star: theSun, moons: [callisto]})
          .then(record => {
            assert.ok(record.get('id'), 'assigned id');
            assert.equal(record.get('name'), 'Jupiter', 'assigned specified attribute');
            assert.equal(record.get('atmosphere'), false, 'assigned default value for unspecified attribute');
            assert.equal(record.get('star'), theSun, 'assigned hasOne');
            assert.deepEqual(record.get('moons.firstObject'), callisto, 'assigned hasMany');
            done();
          });
      });
    });
  });

  test('remove model', function(assert) {
    Ember.run(() => {
      const done = assert.async();

      store
        .addRecord({type: 'star', name: 'The Sun'})
        .tap(record => record.remove())
        .then(record => assert.ok(store.findRecord('star', record.get('id'))))
        .then(done);
    });
  });

  test('add to hasMany', function(assert) {
    Ember.run(() => {
      const done = assert.async();

      Promise.all([
        store.addRecord({type: 'planet', name: 'Jupiter'}),
        store.addRecord({type: 'moon', name: 'Callisto'})
      ])
      .tap(([jupiter, callisto]) => {
        jupiter.get('moons').pushObject(callisto);
        return store.settleTransforms();
      })
      .then(([jupiter, callisto]) => {
        assert.ok(jupiter.get('moons').contains(callisto), 'added record to hasMany');
        assert.equal(callisto.get('planet'), jupiter, 'updated inverse');
        done();
      });
    });
  });

  test('remove from hasMany', function(assert) {
    Ember.run(() => {
      const done = assert.async();

      Promise.all([
        store.addRecord({type: 'planet', name: 'Jupiter'}),
        store.addRecord({type: 'moon', name: 'Callisto'})
      ])
      .tap(([jupiter, callisto]) => store.addToHasMany(jupiter, 'moons', callisto))
      .tap(([jupiter, callisto]) => {
        jupiter.get('moons').removeObject(callisto);
        return store.settleTransforms();
      })
      .then(([jupiter, callisto]) => {
        assert.ok(!jupiter.get('moons').contains(callisto), 'removed record from hasMany');
        assert.ok(!callisto.get('planet'), 'updated inverse');
        done();
      });
    });
  });

  test('replace hasOne with record', function(assert) {
    Ember.run(() => {
      const done = assert.async();

      Promise.all([
        store.addRecord({type: 'planet', name: 'Jupiter'}),
        store.addRecord({type: 'moon', name: 'Callisto'})
      ])
      .tap(([jupiter, callisto]) => {
        callisto.set('planet', jupiter);
        return store.settleTransforms();
      })
      .then(([jupiter, callisto]) => {
        assert.equal(callisto.get('planet'), jupiter, 'replaced hasOne with record');
        assert.ok(jupiter.get('moons').contains(callisto), 'updated inverse');
        done();
      });
    });
  });

  test('replace hasOne with null', function(assert) {
    Ember.run(() => {
      const done = assert.async();

      Promise.all([
        store.addRecord({type: 'planet', name: 'Jupiter'}),
        store.addRecord({type: 'moon', name: 'Callisto'})
      ])
      .tap(([jupiter, callisto]) => store.replaceHasOne(callisto, 'planet', jupiter))
      .tap(([jupiter, callisto]) => {
        callisto.set('planet', null);
        return store.settleTransforms();
      })
      .then(([jupiter, callisto]) => {
        assert.equal(callisto.get('planet'), null, 'replaced hasOne with null');
        assert.ok(!jupiter.get('moons').contains(callisto), 'removed from inverse hasMany');
        done();
      });
    });
  });

  test('replace attribute on model', function(assert) {
    Ember.run(() => {
      const done = assert.async();

      store
        .addRecord({type: 'planet', name: 'Jupiter'})
        .tap(record => record.set('name', 'Jupiter2'))
        .then(record => assert.equal(record.get('name'), 'Jupiter2'))
        .then(done);
    });
  });
});
