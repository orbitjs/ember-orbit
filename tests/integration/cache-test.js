import { Planet, Moon, Star } from 'dummy/tests/support/dummy-models';
import { createStore } from 'dummy/tests/support/store';
import {
  addRecord,
  removeRecord,
  replaceAttribute,
  oqb,
  oqe
} from '@orbit/data';
import { module, test } from 'qunit';

module('Integration - Cache', function(hooks) {
  let store;
  let cache;

  hooks.beforeEach(function() {
   const models = { planet: Planet, moon: Moon, star: Star };
    store = createStore({ models });
    cache = store.get('cache');
  });

  hooks.afterEach(function() {
    store = null;
    cache = null;
  });

  test('liveQuery - adds record that becomes a match', function(assert) {
    const qe = oqb.records('planet')
                  .filterAttributes({ name: 'Jupiter' });

    const liveQuery = cache.liveQuery(qe);

    return store.addRecord({ id: 'jupiter', type: 'planet', attributes: { name: 'Jupiter' } })
      .then(() => {
        assert.equal(liveQuery.get('length'), 0);
        return store.update(replaceAttribute({ type: 'planet', id: 'jupiter' }, 'name', 'Jupiter'))
      })
      .then(() => {
        assert.equal(liveQuery.get('length'), 1);
      });
  });

  test('liveQuery - updates when matching record is added', function(assert) {
    const planets = cache.liveQuery(oqb.records('planet'));
    const addJupiter = store.addRecord({ id: 'jupiter', type: 'planet', name: 'Jupiter' });
    return addJupiter.then(jupiter => assert.ok(planets.includes(jupiter)));
  });

  test('liveQuery - updates when matching record is removed', function(assert) {
    const done = assert.async();

    Ember.run(() => {
      const planets = cache.liveQuery(oqb.records('planet'));

      store
        .addRecord({type: 'planet', name: 'Jupiter'})
        .tap(jupiter => store.removeRecord(jupiter))
        .then(jupiter => assert.ok(!planets.includes(jupiter)))
        .then(() => done());
    });
  });

  test('liveQuery - ignores non matching record', function(assert) {
    const done = assert.async();

    Ember.run(() => {
      const planets = cache.liveQuery(oqb.records('planet'));

      store
        .addRecord({type: 'moon', name: 'Callisto'})
        .then(callisto => assert.ok(!planets.includes(callisto)))
        .then(() => done());
    });
  });

  test('liveQuery - removes record that has been removed', function(assert) {
    const done = assert.async();

    Ember.run(() => {
      const planets = cache.liveQuery(oqb.records('planet'));

      store
        .update([
          addRecord({type: 'planet', id: 'Jupiter'}),
          addRecord({type: 'planet', id: 'Earth'})
        ])
        .then(() => assert.equal(planets.get('length'), 2))
        .then(() => assert.equal(planets.get('content.length'), 2))
        .then(() => store.update(removeRecord({type: 'planet', id: 'Jupiter'})))
        .then(() => assert.equal(planets.get('length'), 1))
        .then(() => assert.equal(planets.get('content.length'), 1))
        .then(() => done());
    });
  });

  test('liveQuery - removes record that no longer matches', function(assert) {
    const done = assert.async();

    Ember.run(() => {
      const planets = cache.liveQuery(
        oqe('filter',
          oqe('records', 'planet'),
          oqe('equal', oqe('attribute', 'name'), 'Jupiter')));

      store
        .addRecord({type: 'planet', name: 'Jupiter'})
        .tap(() => assert.equal(planets.get('length'), 1))
        .tap(jupiter => assert.ok(planets.includes(jupiter)))
        .tap(jupiter => store.update(replaceAttribute(jupiter, 'name', 'Jupiter2')))
        .tap(() => assert.equal(planets.get('length'), 0))
        .tap(jupiter => assert.ok(!planets.includes(jupiter)))
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

  test('#retrieveHasOne', function(assert) {
    const done = assert.async();

    Ember.run(() => {
      Ember.RSVP.Promise.all([
        store.addRecord({type: 'planet', name: 'Jupiter'}),
        store.addRecord({type: 'moon', name: 'Callisto'})
      ])
      .tap(([jupiter, callisto]) => {
        callisto.set('planet', jupiter);
        return store.requestQueue.process();
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

  test('#query - record', function(assert) {
    let earth;

    return store.addRecord({ type: 'planet', name: 'Earth' })
      .then(record => {
        earth = record;
        return store.addRecord({ type: 'planet', name: 'Jupiter' });
      })
      .then(() => {
        const foundRecord = cache.query(oqb.record(earth));
        assert.strictEqual(foundRecord, earth);
      });
  });

  test('#query - records', function(assert) {
    let earth, jupiter;

    return store.addRecord({ type: 'planet', name: 'Earth' })
      .then(record => {
        earth = record;
        return store.addRecord({ type: 'planet', name: 'Jupiter' });
      })
      .then(record => {
        jupiter = record;

        const foundRecords = cache.query(oqb.records('planet'));
        assert.equal(foundRecords.length, 2, 'two records found');
        assert.ok(foundRecords.indexOf(earth) > -1, 'earth is included');
        assert.ok(foundRecords.indexOf(jupiter) > -1, 'jupiter is included');
      });
  });

  test('#query - filter', function(assert) {
    let earth;

    return store.addRecord({ type: 'planet', name: 'Earth' })
      .then(record => {
        earth = record;
        return store.addRecord({ type: 'planet', name: 'Jupiter' });
      })
      .then(() => {
        const foundRecords = cache.query(oqb.records('planet').filterAttributes({ name: 'Earth' }));
        assert.deepEqual(foundRecords, [earth]);
        assert.strictEqual(foundRecords[0], earth);
      });
  });

  test('#find - by type and id', function(assert) {
    let earth;

    return store.addRecord({ type: 'planet', name: 'Earth' })
      .then(record => {
        earth = record;
        return store.addRecord({ type: 'planet', name: 'Jupiter' });
      })
      .then(() => {
        const foundRecord = cache.find('planet', earth.id);
        assert.strictEqual(foundRecord, earth);
      });
  });

  test('#find - by type', function(assert) {
    let earth, jupiter;

    return store.addRecord({ type: 'planet', name: 'Earth' })
      .then(record => {
        earth = record;
        return store.addRecord({ type: 'planet', name: 'Jupiter' });
      })
      .then(record => {
        jupiter = record;

        const foundRecords = cache.find('planet');
        assert.equal(foundRecords.length, 2, 'two records found');
        assert.ok(foundRecords.indexOf(earth) > -1, 'earth is included');
        assert.ok(foundRecords.indexOf(jupiter) > -1, 'jupiter is included');
      });
  });
});
