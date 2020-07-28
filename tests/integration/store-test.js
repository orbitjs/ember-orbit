import {
  Planet,
  Moon,
  Star,
  BinaryStar,
  PlanetarySystem
} from 'dummy/tests/support/dummy-models';
import { createStore } from 'dummy/tests/support/store';
import { buildTransform } from '@orbit/data';
import { module, test } from 'qunit';
import { waitForSource } from 'ember-orbit/test-support';

module('Integration - Store', function (hooks) {
  let store;
  const models = {
    planet: Planet,
    moon: Moon,
    star: Star,
    binaryStar: BinaryStar,
    planetarySystem: PlanetarySystem
  };

  hooks.beforeEach(function () {
    store = createStore({ models });
  });

  hooks.afterEach(function () {
    store = null;
  });

  test('exposes properties from source', function (assert) {
    assert.strictEqual(store.keyMap, store.source.keyMap);
    assert.strictEqual(store.schema, store.source.schema);
    assert.strictEqual(store.transformBuilder, store.transformBuilder);
    assert.strictEqual(store.transformLog, store.source.transformLog);
    assert.strictEqual(store.requestQueue, store.source.requestQueue);
    assert.strictEqual(store.syncQueue, store.source.syncQueue);
  });

  test('#addRecord', async function (assert) {
    const planet = await store.addRecord({ type: 'planet', name: 'Earth' });

    assert.ok(planet instanceof Planet);
    assert.ok(planet.id, 'assigned id');
    assert.equal(planet.name, 'Earth');
  });

  test('#addRecord - with blocking sync updates', async function (assert) {
    store.source.on('beforeUpdate', (transform) => {
      return store.source.sync(transform);
    });

    const planet = await store.addRecord({ type: 'planet', name: 'Earth' });
    assert.ok(planet instanceof Planet);
    assert.ok(planet.id, 'assigned id');
    assert.equal(planet.name, 'Earth');
  });

  test('#findRecord', async function (assert) {
    const earth = await store.addRecord({ type: 'planet', name: 'Earth' });
    const planet = await store.findRecord('planet', earth.id);
    assert.strictEqual(planet, earth);
  });

  test('#findRecord - missing record', async function (assert) {
    try {
      await store.findRecord('planet', 'jupiter');
    } catch (e) {
      assert.equal(e.message, 'Record not found: planet:jupiter');
    }
  });

  test('#findRecordByKey - can find a previously added record by key', async function (assert) {
    const earth = await store.addRecord({
      type: 'planet',
      name: 'Earth',
      remoteId: 'p01'
    });
    const record = await store.findRecordByKey('planet', 'remoteId', 'p01');
    assert.strictEqual(record, earth);
  });

  test('#findRecordByKey - will generate a local id for a record that has not been added yet', async function (assert) {
    const schema = store.source.schema;
    const prevFn = schema.generateId;
    schema.generateId = () => 'abc';

    try {
      await store.findRecordByKey('planet', 'remoteId', 'p01');
    } catch (e) {
      assert.equal(
        store.source.keyMap.keyToId('planet', 'remoteId', 'p01'),
        'abc'
      );
      assert.equal(e.message, 'Record not found: planet:abc');
      schema.generateId = prevFn;
    }
  });

  test('#peekRecord - existing record', async function (assert) {
    const jupiter = await store.addRecord({ type: 'planet', name: 'Jupiter' });
    assert.strictEqual(
      store.peekRecord('planet', jupiter.id),
      jupiter,
      'retrieved record'
    );
  });

  test('#peekRecord - missing record', async function (assert) {
    assert.strictEqual(store.peekRecord('planet', 'fake'), undefined);
  });

  test('#peekRecordByKey - existing record', async function (assert) {
    const jupiter = await store.addRecord({
      type: 'planet',
      name: 'Jupiter',
      remoteId: 'p01'
    });
    assert.strictEqual(
      store.peekRecordByKey('planet', 'remoteId', 'p01'),
      jupiter,
      'retrieved record'
    );
  });

  test('#peekRecordByKey - missing record', async function (assert) {
    assert.strictEqual(
      store.keyMap.keyToId('planet', 'remoteId', 'p01'),
      undefined,
      'key is not in map'
    );
    assert.strictEqual(
      store.peekRecordByKey('planet', 'remoteId', 'p01'),
      undefined
    );
    assert.notStrictEqual(
      store.keyMap.keyToId('planet', 'remoteId', 'p01'),
      undefined,
      'id has been generated for key'
    );
  });

  test('#peekRecords', async function (assert) {
    const earth = await store.addRecord({ type: 'planet', name: 'Earth' });
    const jupiter = await store.addRecord({ type: 'planet', name: 'Jupiter' });
    await store.addRecord({ type: 'moon', name: 'Io' });

    const planets = store.peekRecords('planet');
    assert.equal(planets.length, 2);
    assert.ok(planets.includes(earth));
    assert.ok(planets.includes(jupiter));
  });

  test('#removeRecord - when passed a record, it should serialize its identity in a `removeRecord` op', async function (assert) {
    assert.expect(2);

    const record = await store.addRecord({ type: 'planet', name: 'Earth' });

    store.on('update', (data) => {
      assert.deepEqual(
        data.operations,
        [
          {
            op: 'removeRecord',
            record: { type: 'planet', id: record.id }
          }
        ],
        'only the identity has been serialized in the operation'
      );
    });

    await store.removeRecord(record);

    try {
      await store.findRecord('planet', record.id);
    } catch (error) {
      assert.ok(error.message.match(/Record not found/));
    }
  });

  test('#removeRecord - when passed an identity', async function (assert) {
    assert.expect(2);

    const record = await store.addRecord({ type: 'planet', name: 'Earth' });

    store.on('update', (data) => {
      assert.deepEqual(
        data.operations,
        [
          {
            op: 'removeRecord',
            record: { type: 'planet', id: record.id }
          }
        ],
        'only the identity has been serialized in the operation'
      );
    });

    await store.removeRecord({ type: 'planet', id: record.id });

    try {
      await store.findRecord('planet', record.id);
    } catch (error) {
      assert.ok(error.message.match(/Record not found/));
    }
  });

  test('#getTransform - returns a particular transform given an id', async function (assert) {
    const recordA = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter' }
    };

    const addRecordATransform = buildTransform(
      store.transformBuilder.addRecord(recordA)
    );

    await store.sync(addRecordATransform);
    assert.strictEqual(
      store.getTransform(addRecordATransform.id),
      addRecordATransform
    );
  });

  test('#getInverseOperations - returns the inverse operations for a particular transform', async function (assert) {
    const recordA = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter' }
    };

    const addRecordATransform = buildTransform(
      store.transformBuilder.addRecord(recordA)
    );

    await store.sync(addRecordATransform);

    assert.deepEqual(store.getInverseOperations(addRecordATransform.id), [
      { op: 'removeRecord', record: { id: 'jupiter', type: 'planet' } }
    ]);
  });

  test('#transformsSince - returns all transforms since a specified transformId', async function (assert) {
    const recordA = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter' }
    };
    const recordB = {
      id: 'saturn',
      type: 'planet',
      attributes: { name: 'Saturn' }
    };
    const recordC = {
      id: 'pluto',
      type: 'planet',
      attributes: { name: 'Pluto' }
    };
    const tb = store.transformBuilder;

    const addRecordATransform = buildTransform(tb.addRecord(recordA));
    const addRecordBTransform = buildTransform(tb.addRecord(recordB));
    const addRecordCTransform = buildTransform(tb.addRecord(recordC));

    await store.sync(addRecordATransform);
    await store.sync(addRecordBTransform);
    await store.sync(addRecordCTransform);

    assert.deepEqual(
      store.transformsSince(addRecordATransform.id),
      [addRecordBTransform, addRecordCTransform],
      'returns transforms since the specified transform'
    );
  });

  test('#allTransforms - returns all tracked transforms', async function (assert) {
    const recordA = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter' }
    };
    const recordB = {
      id: 'saturn',
      type: 'planet',
      attributes: { name: 'Saturn' }
    };
    const recordC = {
      id: 'pluto',
      type: 'planet',
      attributes: { name: 'Pluto' }
    };
    const tb = store.transformBuilder;

    const addRecordATransform = buildTransform(tb.addRecord(recordA));
    const addRecordBTransform = buildTransform(tb.addRecord(recordB));
    const addRecordCTransform = buildTransform(tb.addRecord(recordC));

    await store.sync(addRecordATransform);
    await store.sync(addRecordBTransform);
    await store.sync(addRecordCTransform);

    assert.deepEqual(
      store.allTransforms(),
      [addRecordATransform, addRecordBTransform, addRecordCTransform],
      'tracks transforms in correct order'
    );
  });

  test('replacing a record invalidates attributes and relationships', async function (assert) {
    const planet = await store.addRecord({
      type: 'planet',
      id: 'p1',
      name: 'Earth'
    });
    const star = await store.addRecord({
      type: 'star',
      id: 's1',
      name: 'The Sun'
    });

    assert.equal(planet.name, 'Earth', 'initial attribute get is fine');
    assert.equal(planet.sun, null, 'initial hasOne get is fine');
    assert.equal(star.name, 'The Sun', 'star has been created properly');

    await store.update((t) =>
      t.updateRecord({
        type: 'planet',
        id: planet.id,
        attributes: { name: 'Jupiter' },
        relationships: { sun: { data: { type: 'star', id: star.id } } }
      })
    );

    assert.strictEqual(planet.name, 'Jupiter', 'attribute has been reset');
    assert.strictEqual(planet.sun, star, 'hasOne has been reset');
  });

  test('#query - findRecord', async function (assert) {
    const earth = await store.addRecord({ type: 'planet', name: 'Earth' });
    const record = await store.query((q) => q.findRecord(earth));
    assert.strictEqual(record, earth);
  });

  test('#query - findRecords', async function (assert) {
    const earth = await store.addRecord({ type: 'planet', name: 'Earth' });
    const jupiter = await store.addRecord({ type: 'planet', name: 'Jupiter' });
    const records = await store.query((q) => q.findRecords('planet'));

    assert.equal(records.length, 2);
    assert.ok(records.includes(earth));
    assert.ok(records.includes(jupiter));
  });

  test('#query - findRelatedRecord', async function (assert) {
    const sun = await store.addRecord({ type: 'star', name: 'The Sun' });
    const jupiter = await store.addRecord({
      type: 'planet',
      name: 'Jupiter',
      sun
    });
    const record = await store.query((q) =>
      q.findRelatedRecord(jupiter.identity, 'sun')
    );
    assert.strictEqual(record, sun);
  });

  test('#query - findRelatedRecords', async function (assert) {
    const io = await store.addRecord({ type: 'moon', name: 'Io' });
    const callisto = await store.addRecord({ type: 'moon', name: 'Callisto' });
    const jupiter = await store.addRecord({
      type: 'planet',
      name: 'Jupiter',
      moons: [io, callisto]
    });
    const records = await store.query((q) =>
      q.findRelatedRecords(jupiter.identity, 'moons')
    );

    assert.deepEqual(records, [io, callisto]);
    assert.strictEqual(records[0], io);
    assert.strictEqual(records[1], callisto);
  });

  test('#query - filter', async function (assert) {
    const earth = await store.addRecord({ type: 'planet', name: 'Earth' });
    await store.addRecord({ type: 'planet', name: 'Jupiter' });
    const records = await store.query((q) =>
      q.findRecords('planet').filter({ attribute: 'name', value: 'Earth' })
    );

    assert.deepEqual(records, [earth]);
    assert.strictEqual(records[0], earth);
  });

  test('#find - by type', async function (assert) {
    let earth = await store.addRecord({ type: 'planet', name: 'Earth' });
    let jupiter = await store.addRecord({ type: 'planet', name: 'Jupiter' });

    let records = await store.find('planet');
    assert.equal(records.length, 2);
    assert.ok(records.includes(earth));
    assert.ok(records.includes(jupiter));
  });

  test('#find - by type and id', async function (assert) {
    const earth = await store.addRecord({ type: 'planet', name: 'Earth' });
    await store.addRecord({ type: 'planet', name: 'Jupiter' });
    const record = await store.find('planet', earth.id);

    assert.strictEqual(record, earth);
  });

  test('#find - missing record', async function (assert) {
    try {
      await store.find('planet', 'jupiter');
    } catch (e) {
      assert.equal(
        e.message,
        'Record not found: planet:jupiter',
        'query - error caught'
      );
    }
  });

  test('#fork - creates a clone of a base store', async function (assert) {
    const forkedStore = store.fork();
    const jupiter = await forkedStore.addRecord({
      type: 'planet',
      name: 'Jupiter',
      classification: 'gas giant'
    });

    assert.equal(forkedStore.base, store);
    assert.notOk(
      store.cache.includesRecord('planet', jupiter.id),
      'store does not contain record'
    );
    assert.ok(
      forkedStore.cache.includesRecord('planet', jupiter.id),
      'fork includes record'
    );
  });

  test('#merge - merges a forked store back into a base store', async function (assert) {
    const forkedStore = store.fork();
    const jupiter = await forkedStore.addRecord({
      type: 'planet',
      name: 'Jupiter',
      classification: 'gas giant'
    });
    await store.merge(forkedStore);

    assert.ok(
      store.cache.includesRecord('planet', jupiter.id),
      'store includes record'
    );
    assert.ok(
      forkedStore.cache.includesRecord('planet', jupiter.id),
      'fork includes record'
    );
  });

  test('#rebase - maintains only unique transforms in fork', async function (assert) {
    const recordA = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter' }
    };
    const recordB = {
      id: 'saturn',
      type: 'planet',
      attributes: { name: 'Saturn' }
    };
    const recordC = {
      id: 'pluto',
      type: 'planet',
      attributes: { name: 'Pluto' }
    };
    const recordD = {
      id: 'neptune',
      type: 'planet',
      attributes: { name: 'Neptune' }
    };
    const recordE = {
      id: 'uranus',
      type: 'planet',
      attributes: { name: 'Uranus' }
    };

    const tb = store.transformBuilder;
    const addRecordA = buildTransform(tb.addRecord(recordA));
    const addRecordB = buildTransform(tb.addRecord(recordB));
    const addRecordC = buildTransform(tb.addRecord(recordC));
    const addRecordD = buildTransform(tb.addRecord(recordD));
    const addRecordE = buildTransform(tb.addRecord(recordE));

    let fork;

    await store.update(addRecordA);
    await store.update(addRecordB);

    fork = store.fork();

    await fork.update(addRecordD);
    await store.update(addRecordC);
    await fork.update(addRecordE);

    fork.rebase();

    assert.deepEqual(fork.allTransforms(), [addRecordD, addRecordE]);

    assert.deepEqual(fork.cache.peekRecords('planet').length, 5);
    assert.ok(fork.cache.includesRecord(recordA.type, recordA.id));
    assert.ok(fork.cache.includesRecord(recordB.type, recordB.id));
    assert.ok(fork.cache.includesRecord(recordC.type, recordC.id));
    assert.ok(fork.cache.includesRecord(recordD.type, recordD.id));
    assert.ok(fork.cache.includesRecord(recordE.type, recordE.id));
  });

  test('create model from schema', async function (assert) {
    store.schema.upgrade({
      models: {
        ...store.schema.models,
        comet: {
          attributes: {
            name: { type: 'string' },
            density: { type: 'number' }
          },
          relationships: {
            planetarySystem: {
              kind: 'hasOne',
              type: 'planetarySystem'
            }
          }
        }
      }
    });

    await store.addRecord({
      type: 'comet',
      name: "Halley's Comet",
      density: 0.6
    });

    const comets = store.peekRecords('comet');
    const comet = comets[0];

    assert.equal(comets.length, 1);

    assert.equal(comet.type, 'comet');
    assert.equal(comet.name, "Halley's Comet");
    assert.equal(comet.density, 0.6);

    const forkedStore = store.fork();
    const forkedComet = forkedStore.peekRecord('comet', comet.id);
    forkedComet.density = 0.7;
    await waitForSource(forkedStore);
    await waitForSource(forkedStore);

    const cometsByDensity = forkedStore.cache.query((q) =>
      q.findRecords('comet').filter({ attribute: 'density', value: 0.7 })
    );

    assert.equal(forkedComet.density, 0.7);
    assert.equal(cometsByDensity.length, 1);
  });
});
