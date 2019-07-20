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

  test('exposes keyMap and schema', function(assert) {
    assert.strictEqual(cache.keyMap, store.source.keyMap);
    assert.strictEqual(cache.schema, store.source.schema);
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

  test('#peekRecord - existing record', async function(assert) {
    const jupiter = await store.addRecord({ type: 'planet', name: 'Jupiter' });
    assert.strictEqual(
      cache.peekRecord('planet', jupiter.id),
      jupiter,
      'retrieved record'
    );
  });

  test('#peekRecord - missing record', async function(assert) {
    assert.strictEqual(cache.peekRecord('planet', 'fake'), undefined);
  });

  test('#peekRecordByKey - existing record', async function(assert) {
    const jupiter = await store.addRecord({
      type: 'planet',
      name: 'Jupiter',
      remoteId: 'p01'
    });
    assert.strictEqual(
      cache.peekRecordByKey('planet', 'remoteId', 'p01'),
      jupiter,
      'retrieved record'
    );
  });

  test('#peekRecordByKey - missing record', async function(assert) {
    assert.strictEqual(
      cache.keyMap.keyToId('planet', 'remoteId', 'p01'),
      undefined,
      'key is not in map'
    );
    assert.strictEqual(
      cache.peekRecordByKey('planet', 'remoteId', 'p01'),
      undefined
    );
    assert.notStrictEqual(
      cache.keyMap.keyToId('planet', 'remoteId', 'p01'),
      undefined,
      'id has been generated for key'
    );
  });

  test('#peekRecords', async function(assert) {
    const earth = await store.addRecord({ type: 'planet', name: 'Earth' });
    const jupiter = await store.addRecord({ type: 'planet', name: 'Jupiter' });
    await store.addRecord({ type: 'moon', name: 'Io' });

    const planets = cache.peekRecords('planet');
    assert.equal(planets.length, 2);
    assert.ok(planets.includes(earth));
    assert.ok(planets.includes(jupiter));
  });

  test('#peekKey - existing record + key', async function(assert) {
    const jupiter = await store.addRecord({ type: 'planet', remoteId: '123' });
    assert.equal(cache.peekKey(jupiter, 'remoteId'), '123');
  });

  test('#peekKey - missing record', async function(assert) {
    assert.strictEqual(
      cache.peekKey({ type: 'planet', id: 'fake' }, 'remoteId'),
      undefined
    );
  });

  test('#peekKey - existing record, missing key', async function(assert) {
    const jupiter = await store.addRecord({ type: 'planet', name: 'Jupiter' });
    assert.strictEqual(cache.peekKey(jupiter, 'fake'), undefined);
  });

  test('#peekAttribute - existing record + attribute', async function(assert) {
    const jupiter = await store.addRecord({ type: 'planet', name: 'Jupiter' });
    assert.equal(cache.peekAttribute(jupiter, 'name'), 'Jupiter');
  });

  test('#peekAttribute - missing record', async function(assert) {
    assert.strictEqual(
      cache.peekAttribute({ type: 'planet', id: 'fake' }, 'name'),
      undefined
    );
  });

  test('#peekAttribute - existing record, missing attribute', async function(assert) {
    const jupiter = await store.addRecord({ type: 'planet', name: 'Jupiter' });
    assert.strictEqual(cache.peekAttribute(jupiter, 'fake'), undefined);
  });

  test('#peekRelatedRecord - existing record + relationship', async function(assert) {
    const jupiter = await store.addRecord({ type: 'planet', name: 'Jupiter' });
    const callisto = await store.addRecord({ type: 'moon', name: 'Callisto' });
    callisto.set('planet', jupiter);
    await waitForSource(store);
    assert.strictEqual(cache.peekRelatedRecord(callisto, 'planet'), jupiter);
  });

  test('#peekRelatedRecord - missing record', async function(assert) {
    assert.strictEqual(
      cache.peekRelatedRecord({ type: 'planet', id: 'fake' }, 'planet'),
      undefined
    );
  });

  test('#peekRelatedRecord - existing record, empty relationship', async function(assert) {
    const callisto = await store.addRecord({
      type: 'moon',
      name: 'Callisto',
      planet: null
    });
    assert.strictEqual(cache.peekRelatedRecord(callisto, 'planet'), null);
  });

  test('#peekRelatedRecord - existing record, missing relationship', async function(assert) {
    const callisto = await store.addRecord({ type: 'moon', name: 'Callisto' });
    assert.strictEqual(cache.peekRelatedRecord(callisto, 'planet'), undefined);
  });

  test('#peekRelatedRecords - existing record + relatedRecords', async function(assert) {
    const callisto = await store.addRecord({ type: 'moon', name: 'Callisto' });
    const europa = await store.addRecord({ type: 'moon', name: 'Europa' });
    const jupiter = await store.addRecord({
      type: 'planet',
      name: 'Jupiter',
      moons: [callisto, europa]
    });
    assert.deepEqual(cache.peekRelatedRecords(jupiter, 'moons'), [
      callisto,
      europa
    ]);
  });

  test('#peekRelatedRecords - missing record', async function(assert) {
    assert.strictEqual(
      cache.peekRelatedRecords({ type: 'planet', id: 'fake' }, 'moons'),
      undefined
    );
  });

  test('#peekRelatedRecords - existing record, empty relationship', async function(assert) {
    const jupiter = await store.addRecord({
      type: 'planet',
      name: 'Jupiter',
      moons: []
    });
    assert.deepEqual(cache.peekRelatedRecords(jupiter, 'moons'), []);
  });

  test('#peekRelatedRecords - existing record, missing relationship', async function(assert) {
    const jupiter = await store.addRecord({
      type: 'planet',
      name: 'Jupiter'
    });
    assert.strictEqual(cache.peekRelatedRecords(jupiter, 'moons'), undefined);
  });

  test('#peekRecordData - existing record', async function(assert) {
    const jupiter = await store.addRecord({ type: 'planet', name: 'Jupiter' });
    const retrievedRecordData = cache.peekRecordData('planet', jupiter.id);
    assert.ok(retrievedRecordData, 'retrieved record data');
    assert.equal(
      retrievedRecordData.attributes.name,
      'Jupiter',
      'retrieved record data has attribute value'
    );
  });

  test('peekRecordData - missing record', async function(assert) {
    assert.strictEqual(cache.peekRecordData('planet', 'fake'), undefined);
  });

  test('#recordIdFromKey - retrieves a record id based on a known key', async function(assert) {
    await store.addRecord({
      type: 'planet',
      id: '123',
      name: 'Earth',
      remoteId: 'p01'
    });
    const id = cache.recordIdFromKey('planet', 'remoteId', 'p01');
    assert.equal(id, '123');
  });

  test('#recordIdFromKey - generates a record id based on an unknown key', async function(assert) {
    cache.schema.generateId = () => '123';
    const id = cache.recordIdFromKey('planet', 'remoteId', 'p01');
    assert.equal(id, '123');
  });

  test('#query - record', async function(assert) {
    const earth = await store.addRecord({ type: 'planet', name: 'Earth' });
    await store.addRecord({ type: 'planet', name: 'Jupiter' });
    const foundRecord = cache.query(q => q.findRecord(earth));
    assert.strictEqual(foundRecord, earth);
  });

  test('#query - missing record', function(assert) {
    assert.throws(
      () => cache.query(q => q.findRecord({ type: 'planet', id: 'fake' })),
      'Record not found: planet:fake'
    );
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
