import { Promise as EmberPromise } from 'rsvp';
import { run } from '@ember/runloop';
import { Planet, Moon, Star } from 'dummy/tests/support/dummy-models';
import { createStore } from 'dummy/tests/support/store';
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
    const liveQuery = cache.liveQuery(q => q.findRecords('planet')
                                            .filter({ attribute: 'name', value: 'Jupiter' }));

    return store.addRecord({ id: 'jupiter', type: 'planet', attributes: { name: 'Jupiter' } })
      .then(() => {
        assert.equal(liveQuery.get('length'), 0);
        return store.update(t => t.replaceAttribute({ type: 'planet', id: 'jupiter' }, 'name', 'Jupiter'))
      })
      .then(() => {
        assert.equal(liveQuery.get('length'), 1);
      });
  });

  test('liveQuery - updates when matching record is added', function(assert) {
    const planets = cache.liveQuery(q => q.findRecords('planet'));
    const addJupiter = store.addRecord({ id: 'jupiter', type: 'planet', name: 'Jupiter' });
    return addJupiter.then(jupiter => assert.ok(planets.includes(jupiter)));
  });

  test('liveQuery - updates when matching record is removed', function(assert) {
    const done = assert.async();

    run(() => {
      const planets = cache.liveQuery(q => q.findRecords('planet'));

      store
        .addRecord({type: 'planet', name: 'Jupiter'})
        .tap(jupiter => store.removeRecord(jupiter))
        .then(jupiter => assert.ok(!planets.includes(jupiter)))
        .then(() => done());
    });
  });

  test('liveQuery - ignores non matching record', function(assert) {
    const done = assert.async();

    run(() => {
      const planets = cache.liveQuery(q => q.findRecords('planet'));

      store
        .addRecord({type: 'moon', name: 'Callisto'})
        .then(callisto => assert.ok(!planets.includes(callisto)))
        .then(() => done());
    });
  });

  test('liveQuery - removes record that has been removed', function(assert) {
    const done = assert.async();

    run(() => {
      const planets = cache.liveQuery(q => q.findRecords('planet'));

      store
        .update(t => [
          t.addRecord({type: 'planet', id: 'Jupiter'}),
          t.addRecord({type: 'planet', id: 'Earth'})
        ])
        .then(() => assert.equal(planets.get('length'), 2))
        .then(() => assert.equal(planets.get('content.length'), 2))
        .then(() => store.update(t => t.removeRecord({type: 'planet', id: 'Jupiter'})))
        .then(() => assert.equal(planets.get('length'), 1))
        .then(() => assert.equal(planets.get('content.length'), 1))
        .then(() => done());
    });
  });

  test('liveQuery - removes record that no longer matches', function(assert) {
    const done = assert.async();

    run(() => {
      const planets = cache.liveQuery(q => q.findRecords('planet')
                                            .filter({ attribute: 'name', value: 'Jupiter' }));

      store
        .addRecord({type: 'planet', name: 'Jupiter'})
        .tap(() => assert.equal(planets.get('length'), 1))
        .tap(jupiter => assert.ok(planets.includes(jupiter)))
        .tap(jupiter => store.update(t => t.replaceAttribute(jupiter, 'name', 'Jupiter2')))
        .tap(() => assert.equal(planets.get('length'), 0))
        .tap(jupiter => assert.ok(!planets.includes(jupiter)))
        .then(() => done());
    });
  });

  test('#retrieveAttribute', function(assert) {
    const done = assert.async();

    run(() => {
      store
        .addRecord({type: 'planet', name: 'Jupiter'})
        .then((jupiter) => {
          assert.equal(cache.retrieveAttribute(jupiter, 'name'), 'Jupiter');
          done();
        });
    });
  });

  test('#retrieveRelatedRecord', function(assert) {
    const done = assert.async();

    run(() => {
      EmberPromise.all([
        store.addRecord({type: 'planet', name: 'Jupiter'}),
        store.addRecord({type: 'moon', name: 'Callisto'})
      ])
      .tap(([jupiter, callisto]) => {
        callisto.set('planet', jupiter);
        return store.requestQueue.process();
      })
      .then(([jupiter, callisto]) => {
        assert.equal(cache.retrieveRelatedRecord(callisto, 'planet'), jupiter);
        done();
      });
    });
  });

  test('#retrieveRecord', function(assert) {
    const done = assert.async();
    run(() => {
      store
        .addRecord({type: 'planet', name: 'Jupiter'})
        .then((record) => cache.retrieveRecord('planet', record.get('id')))
        .then((retrievedRecord) => assert.ok(retrievedRecord, 'retrieved record'))
        .then(() => done());
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
        const foundRecord = cache.query(q => q.findRecord(earth));
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

        const foundRecords = cache.query(q => q.findRecords('planet'));
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
        const foundRecords = cache.query(q => q.findRecords('planet').filter({ attribute: 'name', value: 'Earth' }));
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
