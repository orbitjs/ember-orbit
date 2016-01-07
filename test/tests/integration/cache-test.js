import {
  dummyModels,
  createStore
} from 'tests/test-helper';

import Orbit from 'orbit';
import { queryExpression as oqe } from 'orbit-common/oql/expressions';
const { Planet, Moon, Star } = dummyModels;


module('Integration - Cache', function(hooks) {
  let store;
  let cache;

  hooks.beforeEach(function() {

    // this shouldn't be necessary, however for some reason Orbit.Promise is set to
    // null at a seemingly random point through the cache tests (usually it occurs after 3-5 tests)
    Orbit.Promise = Ember.RSVP.Promise;

    const models = { planet: Planet, moon: Moon, star: Star };
    store = createStore({ models });
    cache = store.get('cache');
  });

  hooks.afterEach(function() {
    store = null;
    cache = null;
  });

  test('liveQuery - adds record that becomes a match', function(assert) {
    const done = assert.async();

    Ember.run(() => {
      const planets = cache.liveQuery({
        oql:
          oqe('filter',
            oqe('recordsOfType', 'planet'),
            oqe('equal', oqe('get', 'attributes/name'), 'Jupiter')) });

      store
        .addRecord({type: 'planet', name: 'Jupiter2'})
        .tap(jupiter => store.replaceAttribute(jupiter, 'name', 'Jupiter'))
        .then(jupiter => assert.ok(planets.contains(jupiter)))
        .then(() => assert.equal(planets.get('length'), 1))
        .then(() => done());
    });
  });

  test('liveQuery - updates when matching record is added', function(assert) {
    const done = assert.async();

    Ember.run(() => {
      const planets = cache.liveQuery({oql: oqe('recordsOfType', 'planet')});

      store
        .addRecord({type: 'planet', name: 'Jupiter'})
        .then(jupiter => assert.ok(planets.contains(jupiter)))
        .then(() => done());
    });
  });

  test('liveQuery - updates when matching record is removed', function(assert) {
    const done = assert.async();

    Ember.run(() => {
      const planets = cache.liveQuery({oql: oqe('recordsOfType', 'planet')});

      store
        .addRecord({type: 'planet', name: 'Jupiter'})
        .tap(jupiter => store.removeRecord(jupiter))
        .then(jupiter => assert.ok(!planets.contains(jupiter)))
        .then(() => done());
    });
  });

  test('liveQuery - ignores non matching record', function(assert) {
    const done = assert.async();

    Ember.run(() => {
      const planets = cache.liveQuery({oql: oqe('recordsOfType', 'planet')});

      store
        .addRecord({type: 'moon', name: 'Callisto'})
        .then(callisto => assert.ok(!planets.contains(callisto)))
        .then(() => done());
    });
  });

  test('liveQuery - removes record that no longer matches', function(assert) {
    const done = assert.async();

    Ember.run(() => {
      const planets = cache.liveQuery({
        oql:
          oqe('filter',
            oqe('recordsOfType', 'planet'),
            oqe('equal', oqe('get', 'attributes/name'), 'Jupiter')) });

      store
        .addRecord({type: 'planet', name: 'Jupiter'})
        .tap(jupiter => store.replaceAttribute(jupiter, 'name', 'Jupiter2'))
        .then(jupiter => assert.ok(!planets.contains(jupiter)))
        .then(() => done());
    });
  });


  test('#retrieveAttribute', function(assert) {
    const done = assert.async();

    Ember.run(() => {
      store
        .addRecord({type: 'planet', name: 'Jupiter'})
        .then((jupiter) => {
          assert.equal(cache.retrieveAttribute(jupiter, 'name'), 'Jupiter');
          done();
        });
    });
  });

  test('#retrieve', function(assert) {
    const done = assert.async();

    Ember.run(() => {
      store
        .addRecord({type: 'planet', name: 'Jupiter'})
        .then((jupiter) => {
          assert.equal(cache.retrieve(['planet', jupiter.get('id'), 'attributes', 'name']), 'Jupiter');
          done();
        });
    });
  });

  test('#retrieveHasOne', function(assert) {
    const done = assert.async();

    Ember.run(() => {
      Ember.RSVP.Promise.all([
        store.addRecord({type: 'planet', name: 'Jupiter'}),
        store.addRecord({type: 'moon', name: 'Callisto'})
      ])
      .tap(([jupiter, callisto]) => {
        callisto.set('planet', jupiter);
        return store;
      })
      .then(([jupiter, callisto]) => {
        assert.equal(cache.retrieveHasOne(callisto, 'planet'), jupiter);
        done();
      });
    });
  });

  test('#retrieveRecord', function(assert) {
    Ember.run(() => {
      store
        .addRecord({type: 'planet', name: 'Jupiter'})
        .then((record) => cache.retrieveRecord('planet', record.get('id')))
        .then((retrievedRecord) => assert.ok(retrievedRecord, 'retrieved record'));
    });
  });
});
