import { dummyModels } from 'dummy/tests/support/dummy-models';
import { createStore } from 'dummy/tests/support/store';

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

      Ember.RSVP.Promise.all([
        store.addRecord({type: 'star', name: 'The Sun'}),
        store.addRecord({type: 'moon', name: 'Callisto'})
      ])
      .then(([theSun, callisto]) => {
        store
          .addRecord({type: 'planet', galaxyAlias: 'planet:jupiter', name: 'Jupiter', star: theSun, moons: [callisto]})
          .then(record => {
            assert.ok(record.get('id'), 'assigned id');
            assert.equal(record.get('name'), 'Jupiter', 'assigned specified attribute');
            assert.equal(record.get('atmosphere'), false, 'assigned default value for unspecified attribute');
            assert.equal(record.get('galaxyAlias'), 'planet:jupiter', 'assigned secondary key');
            // assert.equal(record.get('star'), theSun, 'assigned hasOne');
            // assert.deepEqual(record.get('moons.firstObject'), callisto, 'assigned hasMany');
            done();
          });
      });
    });
  });

  test('remove model', function(assert) {
    Ember.run(() => {
      const done = assert.async();
      const cache = store.get('cache');

      store
        .addRecord({type: 'star', name: 'The Sun'})
        .tap(record => record.remove())
        .then(record => {
          assert.ok(!cache.retrieve(['star', record.get('id')]));
          assert.ok(record.get('disconnected'), 'record has been disconnected from store');
          assert.throws(() => record.get('name'), Ember.Error, 'record has been removed from Store');
        })
        .then(done);
    });
  });

  test('add to hasMany', function(assert) {
    Ember.run(() => {
      const done = assert.async();

      Ember.RSVP.Promise.all([
        store.addRecord({type: 'planet', name: 'Jupiter'}),
        store.addRecord({type: 'moon', name: 'Callisto'})
      ])
      .tap(([jupiter, callisto]) => {
        return jupiter.get('moons').pushObject(callisto);
        // console.debug('pushed');
        // return [jupiter, callisto];
      })
      .then(([jupiter, callisto]) => {
        // console.debug('asserting');
        assert.ok(jupiter.get('moons').contains(callisto), 'added record to hasMany');
        assert.equal(callisto.get('planet'), jupiter, 'updated inverse');
        done();
      });
    });
  });

  test('remove from hasMany', function(assert) {
    Ember.run(() => {
      const done = assert.async();

      Ember.RSVP.Promise.all([
        store.addRecord({type: 'planet', name: 'Jupiter'}),
        store.addRecord({type: 'moon', name: 'Callisto'})
      ])
      .tap(([jupiter, callisto]) => jupiter.get('moons').pushObject(callisto))
      .tap(([jupiter, callisto]) => {
        jupiter.get('moons').removeObject(callisto);
        return store;
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

      Ember.RSVP.Promise.all([
        store.addRecord({type: 'planet', name: 'Jupiter'}),
        store.addRecord({type: 'moon', name: 'Callisto'})
      ])
      .tap(([jupiter, callisto]) => {
        callisto.set('planet', jupiter);
        return store;
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

      Ember.RSVP.Promise.all([
        store.addRecord({type: 'planet', name: 'Jupiter'}),
        store.addRecord({type: 'moon', name: 'Callisto'})
      ])
      .tap(([jupiter, callisto]) => callisto.set('planet', jupiter))
      .tap(([_jupiter, callisto]) => {
        callisto.set('planet', null);
        return store;
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

  test('replace key', function(assert) {
    Ember.run(() => {
      const done = assert.async();

      store
        .addRecord({type: 'planet', name: 'Jupiter', galaxyAlias: 'planet:jupiter'})
        .tap(record => record.set('galaxyAlias', 'planet:joopiter'))
        .then(record => assert.equal(record.get('galaxyAlias'), 'planet:joopiter'))
        .then(done);
    });
  });

  test('destroy model', function(assert) {
    Ember.run(() => {
      const done = assert.async();
      const cache = store.get('cache');

      store
        .addRecord({type: 'planet', name: 'Jupiter'})
        .tap(record => record.destroy())
        .then(record => {
          const identifier = record.getProperties('type', 'id');
          assert.ok(!cache.get('_identityMap').contains(identifier), 'removed from identity map');
        })
        .then(done);
    });
  });
});
