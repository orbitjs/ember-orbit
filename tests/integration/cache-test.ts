import { Planet, Moon, Star } from 'dummy/tests/support/dummy-models';
import { Cache, Store } from 'ember-orbit';
import { createStore } from 'dummy/tests/support/store';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { waitForSource } from 'ember-orbit/test-support';
import { buildTransform } from '@orbit/data';
import type ApplicationInstance from '@ember/application/instance';

module('Integration - Cache', function (hooks) {
  setupTest(hooks);

  let store: Store;
  let cache: Cache;

  hooks.beforeEach(function () {
    store = createStore(this.owner as ApplicationInstance, {
      planet: Planet,
      moon: Moon,
      star: Star,
    }).fork();
    cache = store.cache;
  });

  test('exposes store', function (assert) {
    assert.strictEqual(cache.store, store);
  });

  test('exposes properties from underlying MemoryCache', function (assert) {
    assert.strictEqual(cache.sourceCache, store.source.cache);
    assert.strictEqual(cache.keyMap, store.source.keyMap);
    assert.strictEqual(cache.schema, store.source.schema);
    assert.strictEqual(cache.queryBuilder, store.source.queryBuilder);
    assert.strictEqual(cache.transformBuilder, store.source.transformBuilder);
    assert.strictEqual(cache.validatorFor, store.source.validatorFor);
  });

  test('#getRecordData - existing record', async function (assert) {
    const jupiter = await store.addRecord({ type: 'planet', name: 'Jupiter' });
    const retrievedRecordData = cache.getRecordData('planet', jupiter.id);
    assert.ok(retrievedRecordData, 'retrieved record data');
    assert.strictEqual(
      retrievedRecordData!.attributes!['name'],
      'Jupiter',
      'retrieved record data has attribute value'
    );
  });

  test('#getRecordData - missing record', function (assert) {
    assert.strictEqual(cache.getRecordData('planet', 'fake'), undefined);
  });

  test('#includesRecord - existing record', async function (assert) {
    const jupiter = await store.addRecord({ type: 'planet', name: 'Jupiter' });
    assert.strictEqual(cache.includesRecord('planet', jupiter.id), true);
  });

  test('#includesRecord - missing record', function (assert) {
    assert.strictEqual(cache.includesRecord('planet', 'fake'), false);
  });

  test('#recordIdFromKey - retrieves a record id based on a known key', async function (assert) {
    await store.addRecord({
      type: 'planet',
      id: '123',
      name: 'Earth',
      remoteId: 'p01',
    });
    const id = cache.recordIdFromKey('planet', 'remoteId', 'p01');
    assert.strictEqual(id, '123');
  });

  test('#recordIdFromKey - generates a record id based on an unknown key', function (assert) {
    cache.schema.generateId = () => '123';
    const id = cache.recordIdFromKey('planet', 'remoteId', 'p01');
    assert.strictEqual(id, '123');
  });

  test('#update - addRecord', function (assert) {
    const earth = cache.update<Planet>((t) =>
      t.addRecord({ type: 'planet', name: 'Earth' })
    );
    assert.strictEqual(cache.lookup(earth), earth);
    assert.strictEqual(earth.name, 'Earth');
  });

  test('#update - [addRecord]', function (assert) {
    const [earth] = cache.update<[Planet]>((t) => [
      t.addRecord({ type: 'planet', name: 'Earth' }),
    ]);
    assert.strictEqual(cache.lookup(earth), earth);
    assert.strictEqual(earth.name, 'Earth');
  });

  test('#update - [addRecord, addRecord]', function (assert) {
    const [earth, jupiter] = cache.update<[Planet, Planet]>((t) => [
      t.addRecord({ type: 'planet', name: 'Earth' }),
      t.addRecord({ type: 'planet', name: 'Jupiter' }),
    ]);
    assert.strictEqual(cache.lookup(earth), earth);
    assert.strictEqual(earth.name, 'Earth');
    assert.strictEqual(cache.lookup(jupiter), jupiter);
    assert.strictEqual(jupiter.name, 'Jupiter');
  });

  test('#addRecord', function (assert) {
    const earth = cache.addRecord<Planet>({ type: 'planet', name: 'Earth' });
    assert.strictEqual(cache.lookup(earth), earth);
    assert.strictEqual(earth.name, 'Earth');
  });

  test('#updateRecord', function (assert) {
    const earth = cache.addRecord<Planet>({ type: 'planet', name: 'Earth' });
    cache.updateRecord({
      type: 'planet',
      id: earth.id,
      name: 'Mother Earth',
    });
    assert.strictEqual(cache.lookup(earth), earth);
    assert.strictEqual(earth.name, 'Mother Earth');
  });

  test('#removeRecord', function (assert) {
    const earth = cache.addRecord<Planet>({ type: 'planet', name: 'Earth' });
    cache.removeRecord(earth);
    assert.ok(earth.$isDisconnected, 'model is disconnected');
    assert.notOk(
      cache.includesRecord('planet', earth.id),
      'cache does not include record'
    );
  });

  test('#query - record', async function (assert) {
    const earth = await store.addRecord({ type: 'planet', name: 'Earth' });
    await store.addRecord({ type: 'planet', name: 'Jupiter' });
    const foundRecord = cache.query((q) => q.findRecord(earth));
    assert.strictEqual(foundRecord, earth);
  });

  test('#query - missing record', function (assert) {
    const foundRecord = cache.query((q) =>
      q.findRecord({ type: 'planet', id: 'fake' })
    );
    assert.strictEqual(foundRecord, undefined);
  });

  test('#query - missing record (raises exception)', function (assert) {
    cache.defaultQueryOptions = { raiseNotFoundExceptions: true };
    assert.throws(
      () => cache.query((q) => q.findRecord({ type: 'planet', id: 'fake' })),
      'Record not found: planet:fake'
    );
  });

  test('#query - records', async function (assert) {
    const earth = await store.addRecord<Planet>({
      type: 'planet',
      name: 'Earth',
    });
    const jupiter = await store.addRecord<Planet>({
      type: 'planet',
      name: 'Jupiter',
    });
    const foundRecords = cache.query<Planet[]>((q) => q.findRecords('planet'));
    assert.strictEqual(foundRecords.length, 2, 'two records found');
    assert.ok(foundRecords.includes(earth), 'earth is included');
    assert.ok(foundRecords.includes(jupiter), 'jupiter is included');
  });

  test('#query - records - multiple expressions', async function (assert) {
    const earth = await store.addRecord<Planet>({
      type: 'planet',
      name: 'Earth',
    });
    const jupiter = await store.addRecord<Planet>({
      type: 'planet',
      name: 'Jupiter',
    });
    const io = await store.addRecord<Moon>({ type: 'moon', name: 'Io' });
    const callisto = await store.addRecord<Moon>({
      type: 'moon',
      name: 'Callisto',
    });
    const [planets, moons] = cache.query<[Planet[], Moon[]]>((q) => [
      q.findRecords('planet'),
      q.findRecords('moon'),
    ]);
    assert.strictEqual(planets.length, 2, 'two records found');
    assert.ok(planets.includes(earth), 'earth is included');
    assert.ok(planets.includes(jupiter), 'jupiter is included');
    assert.strictEqual(moons.length, 2, 'two records found');
    assert.ok(moons.includes(io), 'io is included');
    assert.ok(moons.includes(callisto), 'callisto is included');
  });

  test('#query - filter', async function (assert) {
    const earth = await store.addRecord<Planet>({
      type: 'planet',
      name: 'Earth',
    });
    await store.addRecord<Planet>({ type: 'planet', name: 'Jupiter' });
    const foundRecords = cache.query<Planet[]>((q) =>
      q.findRecords('planet').filter({ attribute: 'name', value: 'Earth' })
    );
    assert.deepEqual(foundRecords, [earth]);
    assert.strictEqual(foundRecords[0], earth);
  });

  test('#findRecord', async function (assert) {
    const earth = await store.addRecord({ type: 'planet', name: 'Earth' });
    const foundRecord = cache.findRecord('planet', earth.id);
    assert.strictEqual(foundRecord, earth, 'exact match');
  });

  test('#findRecords', async function (assert) {
    const earth = await store.addRecord({ type: 'planet', name: 'Earth' });
    const jupiter = await store.addRecord({ type: 'planet', name: 'Jupiter' });

    const foundRecords = cache.findRecords('planet');
    assert.strictEqual(foundRecords.length, 2, 'two records found');
    assert.ok(foundRecords.includes(earth), 'earth is included');
    assert.ok(foundRecords.includes(jupiter), 'jupiter is included');
  });

  test('#fork - creates a clone of a base cache', function (assert) {
    const forkedCache = cache.fork();
    const jupiter = forkedCache.addRecord({
      type: 'planet',
      name: 'Jupiter',
      classification: 'gas giant',
    });

    assert.strictEqual(forkedCache.base, cache);
    assert.strictEqual(forkedCache.isForked, true);

    assert.notOk(
      cache.includesRecord('planet', jupiter.id),
      'base cache does not contain record'
    );
    assert.ok(
      forkedCache.includesRecord('planet', jupiter.id),
      'fork includes record'
    );
  });

  test('#fork - inherits properties from a base cache', function (assert) {
    const forkedCache = cache.fork();
    assert.strictEqual(forkedCache.base, cache);
    assert.strictEqual(forkedCache.keyMap, cache.keyMap);
    assert.strictEqual(forkedCache.schema, cache.schema);
    assert.strictEqual(forkedCache.queryBuilder, cache.queryBuilder);
    assert.strictEqual(forkedCache.transformBuilder, cache.transformBuilder);
    assert.strictEqual(forkedCache.validatorFor, cache.validatorFor);
  });

  test('#fork - can override properties from a base cache', function (assert) {
    const forkedCache = cache.fork({ autoValidate: false });
    assert.notStrictEqual(cache.validatorFor, undefined);
    assert.strictEqual(forkedCache.validatorFor, undefined);
  });

  test('#merge - merges a forked cache back into a base store', function (assert) {
    const forkedCache = cache.fork();
    const jupiter = forkedCache.update<Planet>((t) =>
      t.addRecord({
        type: 'planet',
        name: 'Jupiter',
        classification: 'gas giant',
      })
    );

    const [jupiterInCache] = cache.merge<[Planet]>(forkedCache);

    assert.deepEqual(
      jupiterInCache.$identity,
      jupiter.$identity,
      'result matches expectations'
    );

    assert.ok(
      store.cache.includesRecord('planet', jupiter.id),
      'store includes record'
    );
    assert.ok(
      forkedCache.includesRecord('planet', jupiter.id),
      'fork includes record'
    );
  });

  test('#merge - can return a full response', function (assert) {
    const forkedCache = cache.fork();
    const jupiter = forkedCache.update<Planet>((t) =>
      t.addRecord({
        type: 'planet',
        name: 'Jupiter',
        classification: 'gas giant',
      })
    );

    const response = cache.merge<[Planet]>(forkedCache, {
      fullResponse: true,
    });

    const [jupiterInCache] = response.data as [Planet];

    assert.deepEqual(
      jupiterInCache.$identity,
      jupiter.$identity,
      'result matches expectations'
    );

    assert.ok(
      store.cache.includesRecord('planet', jupiter.id),
      'store includes record'
    );
    assert.ok(
      forkedCache.includesRecord('planet', jupiter.id),
      'fork includes record'
    );
  });

  test('#rebase - maintains only unique transforms in fork', function (assert) {
    const recordA = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter' },
    };
    const recordB = {
      id: 'saturn',
      type: 'planet',
      attributes: { name: 'Saturn' },
    };
    const recordC = {
      id: 'pluto',
      type: 'planet',
      attributes: { name: 'Pluto' },
    };
    const recordD = {
      id: 'neptune',
      type: 'planet',
      attributes: { name: 'Neptune' },
    };
    const recordE = {
      id: 'uranus',
      type: 'planet',
      attributes: { name: 'Uranus' },
    };

    const tb = cache.transformBuilder;
    const addRecordA = buildTransform(tb.addRecord(recordA));
    const addRecordB = buildTransform(tb.addRecord(recordB));
    const addRecordC = buildTransform(tb.addRecord(recordC));
    const addRecordD = buildTransform(tb.addRecord(recordD));
    const addRecordE = buildTransform(tb.addRecord(recordE));

    cache.update(addRecordA);
    cache.update(addRecordB);

    const fork = cache.fork();

    fork.update(addRecordD);
    cache.update(addRecordC);
    fork.update(addRecordE);

    fork.rebase();

    assert.deepEqual(fork.findRecords('planet').length, 5);
    assert.ok(fork.includesRecord(recordA.type, recordA.id));
    assert.ok(fork.includesRecord(recordB.type, recordB.id));
    assert.ok(fork.includesRecord(recordC.type, recordC.id));
    assert.ok(fork.includesRecord(recordD.type, recordD.id));
    assert.ok(fork.includesRecord(recordE.type, recordE.id));
  });

  test('#reset - clears the state of a cache without a base', function (assert) {
    const recordA = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter' },
    };
    const recordB = {
      id: 'saturn',
      type: 'planet',
      attributes: { name: 'Saturn' },
    };

    const tb = cache.transformBuilder;
    const addRecordA = buildTransform(tb.addRecord(recordA));
    const addRecordB = buildTransform(tb.addRecord(recordB));

    cache.update(addRecordA);
    cache.update(addRecordB);

    cache.reset();

    assert.deepEqual(cache.findRecords('planet').length, 0);
  });

  test('#reset - resets a fork to its base state', function (assert) {
    const recordA = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter' },
    };
    const recordB = {
      id: 'saturn',
      type: 'planet',
      attributes: { name: 'Saturn' },
    };
    const recordC = {
      id: 'pluto',
      type: 'planet',
      attributes: { name: 'Pluto' },
    };
    const recordD = {
      id: 'neptune',
      type: 'planet',
      attributes: { name: 'Neptune' },
    };
    const recordE = {
      id: 'uranus',
      type: 'planet',
      attributes: { name: 'Uranus' },
    };

    const tb = cache.transformBuilder;
    const addRecordA = buildTransform(tb.addRecord(recordA));
    const addRecordB = buildTransform(tb.addRecord(recordB));
    const addRecordC = buildTransform(tb.addRecord(recordC));
    const addRecordD = buildTransform(tb.addRecord(recordD));
    const addRecordE = buildTransform(tb.addRecord(recordE));

    cache.update(addRecordA);
    cache.update(addRecordB);

    const fork = cache.fork();

    fork.update(addRecordD);
    cache.update(addRecordC);
    fork.update(addRecordE);

    fork.reset();

    assert.deepEqual(fork.findRecords('planet').length, 3);
    assert.ok(fork.includesRecord(recordA.type, recordA.id));
    assert.ok(fork.includesRecord(recordB.type, recordB.id));
    assert.ok(fork.includesRecord(recordC.type, recordC.id));
  });

  // Deprecated
  test('#find (deprecated) - by type and id', async function (assert) {
    const earth = await store.addRecord<Planet>({
      type: 'planet',
      name: 'Earth',
    });
    const foundRecord = cache.find('planet', earth.id);
    assert.strictEqual(foundRecord, earth, 'exact match');
  });

  // Deprecated
  test('#find (deprecated) - by type', async function (assert) {
    const earth = await store.addRecord<Planet>({
      type: 'planet',
      name: 'Earth',
    });
    const jupiter = await store.addRecord<Planet>({
      type: 'planet',
      name: 'Jupiter',
    });

    const foundRecords = cache.find('planet') as Planet[];
    assert.strictEqual(foundRecords.length, 2, 'two records found');
    assert.ok(foundRecords.includes(earth), 'earth is included');
    assert.ok(foundRecords.includes(jupiter), 'jupiter is included');
  });

  // deprecated
  test('#peekRecord (deprecated) - existing record', async function (assert) {
    const jupiter = await store.addRecord({ type: 'planet', name: 'Jupiter' });
    assert.strictEqual(
      cache.peekRecord('planet', jupiter.id),
      jupiter,
      'retrieved record'
    );
  });

  // deprecated
  test('#peekRecord (deprecated) - missing record', function (assert) {
    assert.strictEqual(cache.peekRecord('planet', 'fake'), undefined);
  });

  // deprecated
  test('#peekRecordByKey (deprecated) - existing record', async function (assert) {
    const jupiter = await store.addRecord({
      type: 'planet',
      name: 'Jupiter',
      remoteId: 'p01',
    });
    assert.strictEqual(
      cache.peekRecordByKey('planet', 'remoteId', 'p01'),
      jupiter,
      'retrieved record'
    );
  });

  // deprecated
  test('#peekRecordByKey (deprecated) - missing record', function (assert) {
    assert.strictEqual(
      cache.keyMap!.keyToId('planet', 'remoteId', 'p01'),
      undefined,
      'key is not in map'
    );
    assert.strictEqual(
      cache.peekRecordByKey('planet', 'remoteId', 'p01'),
      undefined
    );
    assert.notStrictEqual(
      cache.keyMap!.keyToId('planet', 'remoteId', 'p01'),
      undefined,
      'id has been generated for key'
    );
  });

  // deprecated
  test('#peekRecords (deprecated)', async function (assert) {
    const earth = await store.addRecord({ type: 'planet', name: 'Earth' });
    const jupiter = await store.addRecord({ type: 'planet', name: 'Jupiter' });
    await store.addRecord({ type: 'moon', name: 'Io' });

    const planets = cache.peekRecords('planet');
    assert.strictEqual(planets.length, 2);
    assert.ok(planets.includes(earth));
    assert.ok(planets.includes(jupiter));
  });

  // deprecated
  test('#peekKey (deprecated) - existing record + key', async function (assert) {
    const jupiter = await store.addRecord({ type: 'planet', remoteId: '123' });
    assert.strictEqual(cache.peekKey(jupiter, 'remoteId'), '123');
  });

  // deprecated
  test('#peekKey (deprecated) - missing record', function (assert) {
    assert.strictEqual(
      cache.peekKey({ type: 'planet', id: 'fake' }, 'remoteId'),
      undefined
    );
  });

  // deprecated
  test('#peekKey (deprecated) - existing record, missing key', async function (assert) {
    const jupiter = await store.addRecord({ type: 'planet', name: 'Jupiter' });
    assert.strictEqual(cache.peekKey(jupiter, 'fake'), undefined);
  });

  // deprecated
  test('#peekAttribute (deprecated) - existing record + attribute', async function (assert) {
    const jupiter = await store.addRecord({ type: 'planet', name: 'Jupiter' });
    assert.strictEqual(cache.peekAttribute(jupiter, 'name'), 'Jupiter');
  });

  // deprecated
  test('#peekAttribute (deprecated) - missing record', function (assert) {
    assert.strictEqual(
      cache.peekAttribute({ type: 'planet', id: 'fake' }, 'name'),
      undefined
    );
  });

  // deprecated
  test('#peekAttribute (deprecated) - existing record, missing attribute', async function (assert) {
    const jupiter = await store.addRecord({ type: 'planet', name: 'Jupiter' });
    assert.strictEqual(cache.peekAttribute(jupiter, 'fake'), undefined);
  });

  // deprecated
  test('#peekRelatedRecord (deprecated) - existing record + relationship', async function (assert) {
    const jupiter = await store.addRecord<Planet>({
      type: 'planet',
      name: 'Jupiter',
    });
    const callisto = await store.addRecord<Moon>({
      type: 'moon',
      name: 'Callisto',
    });
    callisto.planet = jupiter;
    await waitForSource(store);
    assert.strictEqual(cache.peekRelatedRecord(callisto, 'planet'), jupiter);
  });

  // deprecated
  test('#peekRelatedRecord (deprecated) - missing record', function (assert) {
    assert.strictEqual(
      cache.peekRelatedRecord({ type: 'planet', id: 'fake' }, 'planet'),
      undefined
    );
  });

  // deprecated
  test('#peekRelatedRecord (deprecated) - existing record, empty relationship', async function (assert) {
    const callisto = await store.addRecord({
      type: 'moon',
      name: 'Callisto',
      planet: null,
    });
    assert.strictEqual(cache.peekRelatedRecord(callisto, 'planet'), null);
  });

  // deprecated
  test('#peekRelatedRecord (deprecated) - existing record, missing relationship', async function (assert) {
    const callisto = await store.addRecord({ type: 'moon', name: 'Callisto' });
    assert.strictEqual(cache.peekRelatedRecord(callisto, 'planet'), undefined);
  });

  // deprecated
  test('#peekRelatedRecords (deprecated) - existing record + relatedRecords', async function (assert) {
    const callisto = await store.addRecord({ type: 'moon', name: 'Callisto' });
    const europa = await store.addRecord({ type: 'moon', name: 'Europa' });
    const jupiter = await store.addRecord({
      type: 'planet',
      name: 'Jupiter',
      moons: [callisto, europa],
    });
    assert.deepEqual(cache.peekRelatedRecords(jupiter, 'moons'), [
      callisto,
      europa,
    ]);
  });

  // deprecated
  test('#peekRelatedRecords (deprecated) - missing record', function (assert) {
    assert.strictEqual(
      cache.peekRelatedRecords({ type: 'planet', id: 'fake' }, 'moons'),
      undefined
    );
  });

  // deprecated
  test('#peekRelatedRecords (deprecated) - existing record, empty relationship', async function (assert) {
    const jupiter = await store.addRecord({
      type: 'planet',
      name: 'Jupiter',
      moons: [],
    });
    assert.deepEqual(cache.peekRelatedRecords(jupiter, 'moons'), []);
  });

  // deprecated
  test('#peekRelatedRecords (deprecated) - existing record, missing relationship', async function (assert) {
    const jupiter = await store.addRecord({
      type: 'planet',
      name: 'Jupiter',
    });
    assert.strictEqual(cache.peekRelatedRecords(jupiter, 'moons'), undefined);
  });

  // deprecated
  test('#peekRecordData (deprecated) - existing record', async function (assert) {
    const jupiter = await store.addRecord({ type: 'planet', name: 'Jupiter' });
    const retrievedRecordData = cache.peekRecordData('planet', jupiter.id);
    assert.ok(retrievedRecordData, 'retrieved record data');
    assert.strictEqual(
      retrievedRecordData!.attributes!['name'],
      'Jupiter',
      'retrieved record data has attribute value'
    );
  });

  // deprecated
  test('peekRecordData (deprecated) - missing record', function (assert) {
    assert.strictEqual(cache.peekRecordData('planet', 'fake'), undefined);
  });
});
