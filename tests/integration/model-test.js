import EmberError from '@ember/error';
import { Promise as EmberPromise } from 'rsvp';
import { Planet, Moon, Star } from 'dummy/tests/support/dummy-models';
import { createStore } from 'dummy/tests/support/store';
import { module, test } from 'qunit';

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
    return EmberPromise.all([
      store.addRecord({type: 'star', name: 'The Sun'}),
      store.addRecord({type: 'moon', name: 'Callisto'})
    ])
      .then(([theSun, callisto]) => {
        return store
          .addRecord({type: 'planet', remoteId: 'planet:jupiter', name: 'Jupiter', sun: theSun, moons: [callisto]})
          .then(record => {
            assert.ok(record.get('id'), 'assigned id');
            assert.deepEqual(record.get('identity'), { id: record.get('id'), type: 'planet' }, 'assigned identity that includes type and id');
            assert.equal(record.get('name'), 'Jupiter', 'assigned specified attribute');
            assert.equal(record.get('remoteId'), 'planet:jupiter', 'assigned secondary key');
            assert.strictEqual(record.get('sun'), theSun, 'assigned hasOne');
            assert.strictEqual(record.get('moons.firstObject'), callisto, 'assigned hasMany');
          });
      });
  });

  test('remove model', function(assert) {
    const cache = store.get('cache');

    return store.addRecord({type: 'star', name: 'The Sun'})
      .tap(record => record.remove())
      .then(record => {
        assert.ok(!cache.retrieveRecord('star', record.id), 'record does not exist in cache');
        assert.ok(record.get('disconnected'), 'record has been disconnected from store');
        assert.throws(() => record.get('name'), EmberError, 'record has been removed from Store');
      });
  });

  test('add to hasMany', function(assert) {
    return EmberPromise.all([
      store.addRecord({type: 'planet', name: 'Jupiter'}),
      store.addRecord({type: 'moon', name: 'Callisto'})
    ])
      .tap(([jupiter, callisto]) => jupiter.get('moons').pushObject(callisto))
      .then(([jupiter, callisto]) => {
        assert.ok(jupiter.get('moons').includes(callisto), 'added record to hasMany');
        assert.equal(callisto.get('planet'), jupiter, 'updated inverse');
      });
  });

  test('remove from hasMany', function(assert) {
    return EmberPromise.all([
      store.addRecord({type: 'planet', name: 'Jupiter'}),
      store.addRecord({type: 'moon', name: 'Callisto'})
    ])
      .tap(([jupiter, callisto]) => jupiter.get('moons').pushObject(callisto))
      .tap(([jupiter, callisto]) => jupiter.get('moons').removeObject(callisto))
      .then(([jupiter, callisto]) => {
        assert.ok(!jupiter.get('moons').includes(callisto), 'removed record from hasMany');
        assert.ok(!callisto.get('planet'), 'updated inverse');
      });
  });

  test('replace hasOne with record', function(assert) {
    return EmberPromise.all([
      store.addRecord({type: 'planet', name: 'Jupiter'}),
      store.addRecord({type: 'moon', name: 'Callisto'})
    ])
      .tap(([jupiter, callisto]) => {
        callisto.set('planet', jupiter);
        return store.requestQueue.process();
      })
      .then(([jupiter, callisto]) => {
        assert.equal(callisto.get('planet'), jupiter, 'replaced hasOne with record');
        assert.ok(jupiter.get('moons').includes(callisto), 'updated inverse');
      });
  });

  test('replaceRelatedRecord invalidates a relationship', function(assert) {
    return EmberPromise.all([
      store.addRecord({type: 'planet', name: 'Jupiter' }),
      store.addRecord({type: 'star', name: 'Sun' })
    ])
      .tap(([jupiter, sun]) => {
        jupiter.get('sun'); // cache the relationship
        return store.source.update(t => t.replaceRelatedRecord(jupiter, 'sun', sun));
      })
      .then(([jupiter, sun]) => {
        assert.equal(jupiter.get('sun'), sun, 'invalidates the relationship');
      });
  });

  test('replace hasOne with null', function(assert) {
    return EmberPromise.all([
      store.addRecord({type: 'planet', name: 'Jupiter'}),
      store.addRecord({type: 'moon', name: 'Callisto'})
    ])
      .tap(([jupiter, callisto]) => {
        callisto.set('planet', jupiter);
        return store.requestQueue.process();
      })
      .tap(([, callisto]) => {
        callisto.set('planet', null);
        return store.requestQueue.process();
      })
      .then(([jupiter, callisto]) => {
        assert.equal(callisto.get('planet'), null, 'replaced hasOne with null');
        assert.ok(!jupiter.get('moons').includes(callisto), 'removed from inverse hasMany');
      });
  });

  test('replace attribute on model', function(assert) {
    return store.addRecord({type: 'planet', name: 'Jupiter'})
      .tap(record => record.set('name', 'Jupiter2'))
      .then(record => assert.equal(record.get('name'), 'Jupiter2'));
  });

  test('replace key', function(assert) {
    return store.addRecord({type: 'planet', name: 'Jupiter', remoteId: 'planet:jupiter'})
      .tap(record => record.set('remoteId', 'planet:joopiter'))
      .then(record => assert.equal(record.get('remoteId'), 'planet:joopiter'));
  });

  test('destroy model', function(assert) {
    const cache = store.get('cache');

    return store.addRecord({type: 'planet', name: 'Jupiter'})
      .tap(record => record.destroy())
      .then(record => {
        const identifier = record.getProperties('type', 'id');
        assert.ok(!cache.get('_identityMap').includes(identifier), 'removed from identity map');
      });
  });
});
