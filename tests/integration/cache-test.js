import { Planet, Moon, Star } from 'dummy/tests/support/dummy-models';
import { createStore } from 'dummy/tests/support/store';
import { module, test } from 'qunit';
import { waitForSource } from 'ember-orbit/test-support';

module('Integration - Cache', function(hooks) {
  let store;
  let cache;

  hooks.beforeEach(function() {
    const models = { planet: Planet, moon: Moon, star: Star };
    store = createStore({ models });
    cache = store.cache;
  });

  hooks.afterEach(function() {
    store = null;
    cache = null;
  });

  test('liveQuery - adds record that becomes a match', async function(assert) {
    const liveQuery = cache.liveQuery(q =>
      q.findRecords('planet').filter({ attribute: 'name', value: 'Jupiter' })
    );

    await store.addRecord({
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter' }
    });
    assert.equal(liveQuery.length, 0);

    await store.update(t =>
      t.replaceAttribute({ type: 'planet', id: 'jupiter' }, 'name', 'Jupiter')
    );
    assert.equal(liveQuery.length, 1);
  });

  test('liveQuery - updates when matching record is added', async function(assert) {
    const planets = cache.liveQuery(q => q.findRecords('planet'));
    const jupiter = await store.addRecord({
      id: 'jupiter',
      type: 'planet',
      name: 'Jupiter'
    });
    assert.ok(planets.includes(jupiter));
  });

  test('liveQuery - updates when matching record is removed', async function(assert) {
    const planets = cache.liveQuery(q => q.findRecords('planet'));
    const jupiter = await store.addRecord({ type: 'planet', name: 'Jupiter' });
    await store.removeRecord(jupiter);
    assert.notOk(planets.includes(jupiter));
  });

  test('liveQuery - ignores non matching record', async function(assert) {
    const planets = cache.liveQuery(q => q.findRecords('planet'));
    const callisto = await store.addRecord({ type: 'moon', name: 'Callisto' });
    assert.notOk(planets.includes(callisto));
  });

  test('liveQuery - removes record that has been removed', async function(assert) {
    const planets = cache.liveQuery(q => q.findRecords('planet'));

    await store.update(t => [
      t.addRecord({ type: 'planet', id: 'Jupiter' }),
      t.addRecord({ type: 'planet', id: 'Earth' })
    ]);
    assert.equal(planets.length, 2);

    await store.update(t => t.removeRecord({ type: 'planet', id: 'Jupiter' }));
    assert.equal(planets.length, 1);
  });

  test('liveQuery - removes record that no longer matches', async function(assert) {
    const planets = cache.liveQuery(q =>
      q.findRecords('planet').filter({ attribute: 'name', value: 'Jupiter' })
    );

    const jupiter = await store.addRecord({ type: 'planet', name: 'Jupiter' });
    assert.equal(planets.length, 1);
    assert.ok(planets.includes(jupiter));

    await store.update(t => t.replaceAttribute(jupiter, 'name', 'Jupiter2'));
    assert.equal(planets.length, 0);
    assert.notOk(planets.includes(jupiter));
  });

  test('#retrieveAttribute', async function(assert) {
    const jupiter = await store.addRecord({ type: 'planet', name: 'Jupiter' });
    assert.equal(cache.retrieveAttribute(jupiter, 'name'), 'Jupiter');
  });

  test('#retrieveRelatedRecord', async function(assert) {
    const jupiter = await store.addRecord({ type: 'planet', name: 'Jupiter' });
    const callisto = await store.addRecord({ type: 'moon', name: 'Callisto' });
    callisto.set('planet', jupiter);
    await waitForSource(store);
    assert.equal(cache.retrieveRelatedRecord(callisto, 'planet'), jupiter);
  });

  test('#retrieveRecord', async function(assert) {
    const jupiter = await store.addRecord({ type: 'planet', name: 'Jupiter' });
    assert.strictEqual(
      cache.retrieveRecord('planet', jupiter.id),
      jupiter,
      'retrieved record'
    );
  });

  test('#retrieveRecordData', async function(assert) {
    const jupiter = await store.addRecord({ type: 'planet', name: 'Jupiter' });
    const retrievedRecordData = cache.retrieveRecordData('planet', jupiter.id);
    assert.ok(retrievedRecordData, 'retrieved record data');
    assert.equal(
      retrievedRecordData.attributes.name,
      'Jupiter',
      'retrieved record data has attribute value'
    );
  });

  test('#query - record', async function(assert) {
    const earth = await store.addRecord({ type: 'planet', name: 'Earth' });
    await store.addRecord({ type: 'planet', name: 'Jupiter' });
    const foundRecord = cache.query(q => q.findRecord(earth));
    assert.strictEqual(foundRecord, earth);
  });

  test('#query - records', async function(assert) {
    const earth = await store.addRecord({ type: 'planet', name: 'Earth' });
    const jupiter = await store.addRecord({ type: 'planet', name: 'Jupiter' });
    const foundRecords = cache.query(q => q.findRecords('planet'));
    assert.equal(foundRecords.length, 2, 'two records found');
    assert.ok(foundRecords.includes(earth), 'earth is included');
    assert.ok(foundRecords.includes(jupiter), 'jupiter is included');
  });

  test('#query - filter', async function(assert) {
    const earth = await store.addRecord({ type: 'planet', name: 'Earth' });
    await store.addRecord({ type: 'planet', name: 'Jupiter' });
    const foundRecords = cache.query(q =>
      q.findRecords('planet').filter({ attribute: 'name', value: 'Earth' })
    );
    assert.deepEqual(foundRecords, [earth]);
    assert.strictEqual(foundRecords[0], earth);
  });

  test('#find - by type and id', async function(assert) {
    const earth = await store.addRecord({ type: 'planet', name: 'Earth' });
    const foundRecord = cache.find('planet', earth.id);
    assert.strictEqual(foundRecord, earth, 'exact match');
  });

  test('#find - by type', async function(assert) {
    const earth = await store.addRecord({ type: 'planet', name: 'Earth' });
    const jupiter = await store.addRecord({ type: 'planet', name: 'Jupiter' });

    const foundRecords = cache.find('planet');
    assert.equal(foundRecords.length, 2, 'two records found');
    assert.ok(foundRecords.includes(earth), 'earth is included');
    assert.ok(foundRecords.includes(jupiter), 'jupiter is included');
  });

  test('#findRecord', async function(assert) {
    const earth = await store.addRecord({ type: 'planet', name: 'Earth' });
    const foundRecord = cache.findRecord('planet', earth.id);
    assert.strictEqual(foundRecord, earth, 'exact match');
  });

  test('#findRecords', async function(assert) {
    const earth = await store.addRecord({ type: 'planet', name: 'Earth' });
    const jupiter = await store.addRecord({ type: 'planet', name: 'Jupiter' });

    const foundRecords = cache.findRecords('planet');
    assert.equal(foundRecords.length, 2, 'two records found');
    assert.ok(foundRecords.includes(earth), 'earth is included');
    assert.ok(foundRecords.includes(jupiter), 'jupiter is included');
  });
});
