import { Store } from 'ember-orbit';
import {
  Planet,
  Moon,
  Star,
  Ocean,
  BinaryStar,
  PlanetarySystem,
} from 'dummy/tests/support/dummy-models';
import { createStore } from 'dummy/tests/support/store';
import { buildTransform } from '@orbit/data';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import type {
  InitializedRecord,
  RecordOperation,
  RecordTransform,
} from '@orbit/records';
import type ApplicationInstance from '@ember/application/instance';

module('Integration - Store', function (hooks) {
  setupTest(hooks);

  let store: Store;

  hooks.beforeEach(function () {
    store = createStore(this.owner as ApplicationInstance, {
      planet: Planet,
      moon: Moon,
      star: Star,
      ocean: Ocean,
      binaryStar: BinaryStar,
      planetarySystem: PlanetarySystem,
    });
  });

  test('exposes properties from source', function (assert) {
    assert.strictEqual(store.keyMap, store.source.keyMap);
    assert.strictEqual(store.schema, store.source.schema);
    assert.strictEqual(store.queryBuilder, store.queryBuilder);
    assert.strictEqual(store.transformBuilder, store.transformBuilder);
    assert.strictEqual(store.transformLog, store.source.transformLog);
    assert.strictEqual(store.requestQueue, store.source.requestQueue);
    assert.strictEqual(store.syncQueue, store.source.syncQueue);
    assert.strictEqual(store.validatorFor, store.source.validatorFor);
  });

  test('`defaultQueryOptions` and `defaultTransformOptions` can be modified', function (assert) {
    const defaultQueryOptions = {
      maxRequests: 3,
    };

    const defaultTransformOptions = {
      maxRequests: 1,
    };

    store.defaultQueryOptions = defaultQueryOptions;
    store.defaultTransformOptions = defaultTransformOptions;

    assert.deepEqual(store.defaultQueryOptions, defaultQueryOptions);
    assert.deepEqual(store.cache.defaultQueryOptions, defaultQueryOptions);

    assert.deepEqual(store.defaultTransformOptions, defaultTransformOptions);
    assert.deepEqual(
      store.cache.defaultTransformOptions,
      defaultTransformOptions,
    );
  });

  test('#addRecord', async function (assert) {
    const planet = await store.addRecord<Planet>({
      type: 'planet',
      name: 'Earth',
    });

    assert.ok(planet instanceof Planet);
    assert.ok(planet.id, 'assigned id');
    assert.strictEqual(planet.name, 'Earth');
  });

  test('#addRecord - with blocking sync updates that return hints', async function (assert) {
    store.source.on(
      'beforeUpdate',
      async (transform: RecordTransform, hints: { data: any }) => {
        await store.sync(transform);
        hints.data = (transform.operations as RecordOperation).record;
      },
    );

    const planet = await store.addRecord<Planet>({
      type: 'planet',
      name: 'Earth',
    });

    assert.ok(planet instanceof Planet);
    assert.ok(planet.id, 'assigned id');
    assert.strictEqual(planet.name, 'Earth');
  });

  test('#findRecord', async function (assert) {
    const earth = await store.addRecord({ type: 'planet', name: 'Earth' });
    const planet = await store.findRecord('planet', earth.id);
    assert.strictEqual(planet, earth);
  });

  test('#findRecord - missing record', async function (assert) {
    const planet = await store.findRecord('planet', 'jupiter');
    assert.strictEqual(planet, undefined);
  });

  test('#findRecord - missing record, `raiseNotFoundExceptions: true`', async function (assert) {
    try {
      await store.findRecord('planet', 'jupiter', {
        raiseNotFoundExceptions: true,
      });
    } catch (e) {
      assert.strictEqual(
        (e as Error).message,
        'Record not found: planet:jupiter',
      );
    }
  });

  test('#findRecord - can find a previously added record by key', async function (assert) {
    const earth = await store.addRecord({
      type: 'planet',
      name: 'Earth',
      remoteId: 'p01',
    });
    const record = await store.findRecord({
      type: 'planet',
      key: 'remoteId',
      value: 'p01',
    });
    assert.strictEqual(record, earth);
  });

  test('#updateRecord - can update a record identified by id', async function (assert) {
    const earth = await store.addRecord<Planet>({
      type: 'planet',
      name: 'Earth',
      remoteId: 'p01',
    });
    await store.updateRecord({
      type: 'planet',
      id: earth.id,
      name: 'Mother Earth',
    });
    assert.strictEqual(earth.name, 'Mother Earth');
  });

  test("#updateRecordFields - can update a record's fields", async function (assert) {
    const earth = await store.addRecord<Planet>({
      type: 'planet',
      name: 'Earth',
      remoteId: 'p01',
    });
    await store.updateRecordFields(earth, {
      name: 'Mother Earth',
    });
    assert.strictEqual(earth.name, 'Mother Earth');
  });

  test('#updateRecordFields - can update a record identified by key', async function (assert) {
    const earth = await store.addRecord<Planet>({
      type: 'planet',
      name: 'Earth',
      remoteId: 'p01',
    });
    await store.updateRecordFields(
      {
        type: 'planet',
        key: 'remoteId',
        value: 'p01',
      },
      {
        name: 'Mother Earth',
      },
    );
    assert.strictEqual(earth.name, 'Mother Earth');
  });

  test('#removeRecord - when passed a record, it should serialize its identity in a `removeRecord` op', async function (assert) {
    assert.expect(2);

    const record = await store.addRecord({ type: 'planet', name: 'Earth' });

    store.on('update', (data: { operations: any }) => {
      assert.deepEqual(
        data.operations,
        {
          op: 'removeRecord',
          record: { type: 'planet', id: record.id },
        },
        'only the identity has been serialized in the operation',
      );
    });

    await store.removeRecord(record);

    assert.strictEqual(await store.findRecord('planet', record.id), undefined);
  });

  test('#removeRecord - when passed an identity', async function (assert) {
    assert.expect(2);

    const record = await store.addRecord({ type: 'planet', name: 'Earth' });

    store.on('update', (data: { operations: any }) => {
      assert.deepEqual(
        data.operations,
        {
          op: 'removeRecord',
          record: { type: 'planet', id: record.id },
        },
        'only the identity has been serialized in the operation',
      );
    });

    await store.removeRecord({ type: 'planet', id: record.id });

    assert.strictEqual(await store.findRecord('planet', record.id), undefined);
  });

  test('#getTransform - returns a particular transform given an id', async function (assert) {
    const recordA = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter' },
    };

    const addRecordATransform = buildTransform(
      store.transformBuilder.addRecord(recordA),
    );

    await store.sync(addRecordATransform);
    assert.strictEqual(
      store.getTransform(addRecordATransform.id),
      addRecordATransform,
    );
  });

  test('#getInverseOperations - returns the inverse operations for a particular transform', async function (assert) {
    const recordA = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter' },
    };

    const addRecordATransform = buildTransform(
      store.transformBuilder.addRecord(recordA),
    );

    await store.sync(addRecordATransform);

    assert.deepEqual(store.getInverseOperations(addRecordATransform.id), [
      { op: 'removeRecord', record: { id: 'jupiter', type: 'planet' } },
    ]);
  });

  test('#getTransformsSince - returns all transforms since a specified transformId', async function (assert) {
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
    const tb = store.transformBuilder;

    const addRecordATransform = buildTransform(tb.addRecord(recordA));
    const addRecordBTransform = buildTransform(tb.addRecord(recordB));
    const addRecordCTransform = buildTransform(tb.addRecord(recordC));

    await store.sync(addRecordATransform);
    await store.sync(addRecordBTransform);
    await store.sync(addRecordCTransform);

    assert.deepEqual(
      store.getTransformsSince(addRecordATransform.id),
      [addRecordBTransform, addRecordCTransform],
      'returns transforms since the specified transform',
    );
  });

  test('#getAllTransforms - returns all tracked transforms', async function (assert) {
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
    const tb = store.transformBuilder;

    const addRecordATransform = buildTransform(tb.addRecord(recordA));
    const addRecordBTransform = buildTransform(tb.addRecord(recordB));
    const addRecordCTransform = buildTransform(tb.addRecord(recordC));

    await store.sync(addRecordATransform);
    await store.sync(addRecordBTransform);
    await store.sync(addRecordCTransform);

    assert.deepEqual(
      store.getAllTransforms(),
      [addRecordATransform, addRecordBTransform, addRecordCTransform],
      'tracks transforms in correct order',
    );
  });

  test('replacing a record invalidates attributes and relationships', async function (assert) {
    const planet = await store.addRecord<Planet>({
      type: 'planet',
      id: 'p1',
      name: 'Earth',
    });
    const star = await store.addRecord<Star>({
      type: 'star',
      id: 's1',
      name: 'The Sun',
    });

    assert.strictEqual(planet.name, 'Earth', 'initial attribute get is fine');
    assert.strictEqual(planet.sun, undefined, 'initial hasOne get is fine');
    assert.strictEqual(star.name, 'The Sun', 'star has been created properly');

    await store.update((t) =>
      t.updateRecord({
        type: 'planet',
        id: planet.id,
        attributes: { name: 'Jupiter' },
        relationships: { sun: { data: { type: 'star', id: star.id } } },
      }),
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
    const earth = await store.addRecord<Planet>({
      type: 'planet',
      name: 'Earth',
    });
    const jupiter = await store.addRecord<Planet>({
      type: 'planet',
      name: 'Jupiter',
    });
    const records = await store.query<Planet[]>((q) => q.findRecords('planet'));

    assert.strictEqual(records.length, 2);
    assert.ok(records.includes(earth));
    assert.ok(records.includes(jupiter));
  });

  test('#query - findRelatedRecord', async function (assert) {
    const sun = await store.addRecord({ type: 'star', name: 'The Sun' });
    const jupiter = await store.addRecord({
      type: 'planet',
      name: 'Jupiter',
      sun,
    });
    const record = await store.query((q) =>
      q.findRelatedRecord(jupiter.$identity, 'sun'),
    );
    assert.strictEqual(record, sun);
  });

  test('#query - findRelatedRecords', async function (assert) {
    const io = await store.addRecord<Moon>({ type: 'moon', name: 'Io' });
    const callisto = await store.addRecord<Moon>({
      type: 'moon',
      name: 'Callisto',
    });
    const jupiter = await store.addRecord<Planet>({
      type: 'planet',
      name: 'Jupiter',
      moons: [io, callisto],
    });
    const records = await store.query<Moon[]>((q) =>
      q.findRelatedRecords(jupiter.$identity, 'moons'),
    );

    assert.deepEqual(records, [io, callisto]);
    assert.strictEqual(records[0], io);
    assert.strictEqual(records[1], callisto);
  });

  test('#query - filter', async function (assert) {
    const earth = await store.addRecord<Planet>({
      type: 'planet',
      name: 'Earth',
    });
    await store.addRecord<Planet>({ type: 'planet', name: 'Jupiter' });
    const records = await store.query<Planet[]>((q) =>
      q.findRecords('planet').filter({ attribute: 'name', value: 'Earth' }),
    );

    assert.deepEqual(records, [earth]);
    assert.strictEqual(records[0], earth);
  });

  test('#query - records - multiple expressions', async function (assert) {
    const [earth, jupiter, io, callisto] = await store.update<
      [Planet, Planet, Moon, Moon]
    >((t) => [
      t.addRecord({
        type: 'planet',
        name: 'Earth',
      }),
      t.addRecord({
        type: 'planet',
        name: 'Jupiter',
      }),
      t.addRecord({ type: 'moon', name: 'Io' }),
      t.addRecord({ type: 'moon', name: 'Callisto' }),
    ]);
    const [planets, moons] = await store.query<[Planet[], Moon[]]>((q) => [
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

  test('#query - records - fullResponse', async function (assert) {
    const earth = await store.addRecord<Planet>({
      type: 'planet',
      name: 'Earth',
    });
    const jupiter = await store.addRecord<Planet>({
      type: 'planet',
      name: 'Jupiter',
    });
    const { data: planets, transforms } = await store.query<Planet[]>(
      (q) => q.findRecords('planet'),
      { fullResponse: true },
    );
    assert.strictEqual(planets!.length, 2, 'two records found');
    assert.ok(planets!.includes(earth), 'earth is included');
    assert.ok(planets!.includes(jupiter), 'jupiter is included');
    assert.strictEqual(transforms, undefined, 'no transforms');
  });

  test('#update - single operation', async function (assert) {
    const earth = await store.update<Planet>((o) =>
      o.addRecord({ type: 'planet', attributes: { name: 'Earth' } }),
    );
    assert.strictEqual(earth.name, 'Earth');
  });

  test('#update - single operation - fullResponse', async function (assert) {
    const { data, transforms } = await store.update<Planet>(
      (o) => o.addRecord({ type: 'planet', attributes: { name: 'Earth' } }),
      {
        fullResponse: true,
      },
    );
    assert.strictEqual(data!.name, 'Earth');
    assert.strictEqual(transforms?.length, 1, 'one transform');
  });

  test('#update - multiple operations', async function (assert) {
    const [earth, jupiter] = await store.update<[Planet, Planet]>((o) => [
      o.addRecord({ type: 'planet', attributes: { name: 'Earth' } }),
      o.addRecord({ type: 'planet', attributes: { name: 'Jupiter' } }),
    ]);
    assert.strictEqual(earth.name, 'Earth');
    assert.strictEqual(jupiter.name, 'Jupiter');
  });

  test('#update - when transform is applied pessimistically via sync without hints', async function (assert) {
    // Sync transform to store before store applies update
    const beforeUpdate = (t: RecordTransform) => {
      return store.sync(t);
    };
    store.on('beforeUpdate', beforeUpdate);

    const response = await store.update((o) => [
      o.addRecord({
        id: 'earth',
        type: 'planet',
        attributes: { name: 'Earth' },
      }),
    ]);

    // Response will be `undefined` because transform was applied `beforeUpdate` via `sync`
    assert.strictEqual(response, undefined, 'undefined returned from update');

    assert.ok(
      store.cache.includesRecord('planet', 'earth'),
      'store includes record',
    );

    store.off('beforeUpdate', beforeUpdate);
  });

  test('#update - when transform is applied pessimistically via sync without hints (fullResponse)', async function (assert) {
    // Sync transform to store before store applies update
    const beforeUpdate = (t: RecordTransform) => {
      return store.sync(t);
    };
    store.on('beforeUpdate', beforeUpdate);

    const response = await store.update(
      (o) => [
        o.addRecord({
          id: 'earth',
          type: 'planet',
          attributes: { name: 'Earth' },
        }),
      ],
      { fullResponse: true },
    );

    // Response will be undefined because transform was applied `beforeUpdate` via `sync`
    assert.strictEqual(
      response.data,
      undefined,
      'undefined returned from update',
    );

    assert.ok(
      store.cache.includesRecord('planet', 'earth'),
      'store includes record',
    );

    store.off('beforeUpdate', beforeUpdate);
  });

  test('#fork - creates a clone of a base store', async function (assert) {
    const forkedStore = store.fork();
    const jupiter = await forkedStore.addRecord({
      type: 'planet',
      name: 'Jupiter',
      classification: 'gas giant',
    });

    assert.strictEqual(forkedStore.base, store);
    assert.strictEqual(forkedStore.isForked, true);

    assert.notOk(
      store.cache.includesRecord('planet', jupiter.id),
      'store does not contain record',
    );
    assert.ok(
      forkedStore.cache.includesRecord('planet', jupiter.id),
      'fork includes record',
    );
  });

  test('#fork - inherits properties from a base store', function (assert) {
    const forkedStore = store.fork();
    assert.strictEqual(forkedStore.base, store);
    assert.strictEqual(forkedStore.keyMap, store.keyMap);
    assert.strictEqual(forkedStore.schema, store.schema);
    assert.strictEqual(forkedStore.queryBuilder, store.queryBuilder);
    assert.strictEqual(forkedStore.transformBuilder, store.transformBuilder);
    assert.strictEqual(store.validatorFor, store.source.validatorFor);
  });

  test('#fork - can override properties from a base store', function (assert) {
    const forkedStore = store.fork({ autoValidate: false });
    assert.notStrictEqual(store.validatorFor, undefined);
    assert.strictEqual(forkedStore.validatorFor, undefined);
  });

  test('#merge - merges a forked store back into a base store', async function (assert) {
    const storeTransforms: RecordTransform[] = [];
    const forkedStore = store.fork();
    const jupiter = await forkedStore.update<Planet>((t) =>
      t.addRecord({
        type: 'planet',
        name: 'Jupiter',
        classification: 'gas giant',
      }),
    );
    const storeTransformed = (t: RecordTransform) => {
      storeTransforms.push(t);
    };
    store.on('transform', storeTransformed);

    const [jupiterInStore] = await store.merge<[Planet]>(forkedStore);

    assert.deepEqual(
      jupiterInStore.$identity,
      jupiter.$identity,
      'result matches expectations',
    );

    assert.ok(
      store.cache.includesRecord('planet', jupiter.id),
      'store includes record',
    );
    assert.ok(
      forkedStore.cache.includesRecord('planet', jupiter.id),
      'fork includes record',
    );

    assert.strictEqual(storeTransforms.length, 1);
    assert.deepEqual(storeTransforms[0]?.operations, [
      {
        op: 'addRecord',
        record: jupiterInStore.$getData() as InitializedRecord,
      },
    ]);
    store.off('transform', storeTransformed);
  });

  test('#merge - when transform is applied pessimistically via sync without hints', async function (assert) {
    const forkedStore = store.fork();
    const jupiter = await forkedStore.update<Planet>((t) =>
      t.addRecord({
        type: 'planet',
        name: 'Jupiter',
        classification: 'gas giant',
      }),
    );

    // Sync transform to store before store applies update
    const beforeUpdate = (t: RecordTransform) => {
      return store.sync(t);
    };
    store.on('beforeUpdate', beforeUpdate);

    const response = await store.merge(forkedStore);

    // Response will be `undefined` because transform was applied `beforeUpdate` via `sync`
    assert.strictEqual(response, undefined, 'undefined returned from merge');

    assert.ok(
      store.cache.includesRecord('planet', jupiter.id),
      'store includes record',
    );
    assert.ok(
      forkedStore.cache.includesRecord('planet', jupiter.id),
      'fork includes record',
    );

    store.off('beforeUpdate', beforeUpdate);
  });

  test('#merge - when transform is applied pessimistically via sync without hints (fullResponse)', async function (assert) {
    const forkedStore = store.fork();
    const jupiter = await forkedStore.update<Planet>((t) =>
      t.addRecord({
        type: 'planet',
        name: 'Jupiter',
        classification: 'gas giant',
      }),
    );

    // Sync transform to store before store applies update
    const beforeUpdate = (t: RecordTransform) => {
      return store.sync(t);
    };
    store.on('beforeUpdate', beforeUpdate);

    const response = await store.merge(forkedStore, { fullResponse: true });

    // Response will be `undefined` because transform was applied `beforeUpdate` via `sync`
    assert.strictEqual(
      response.data,
      undefined,
      'undefined data returned from merge',
    );

    assert.ok(
      store.cache.includesRecord('planet', jupiter.id),
      'store includes record',
    );
    assert.ok(
      forkedStore.cache.includesRecord('planet', jupiter.id),
      'fork includes record',
    );

    store.off('beforeUpdate', beforeUpdate);
  });

  test('#merge - can respond with a fullResponse', async function (assert) {
    const forkedStore = store.fork();
    const jupiter = await forkedStore.addRecord({
      type: 'planet',
      name: 'Jupiter',
      classification: 'gas giant',
    });
    const fullResponse = await store.merge<[Planet]>(forkedStore, {
      fullResponse: true,
    });

    assert.deepEqual(
      fullResponse.data![0].$identity,
      jupiter.$identity,
      'full response has correct data',
    );

    assert.ok(
      store.cache.includesRecord('planet', jupiter.id),
      'store includes record',
    );
    assert.ok(
      forkedStore.cache.includesRecord('planet', jupiter.id),
      'fork includes record',
    );
  });

  test('#rebase - maintains only unique transforms in fork', async function (assert) {
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

    const tb = store.transformBuilder;
    const addRecordA = buildTransform(tb.addRecord(recordA));
    const addRecordB = buildTransform(tb.addRecord(recordB));
    const addRecordC = buildTransform(tb.addRecord(recordC));
    const addRecordD = buildTransform(tb.addRecord(recordD));
    const addRecordE = buildTransform(tb.addRecord(recordE));

    await store.update(addRecordA);
    await store.update(addRecordB);

    const fork = store.fork();

    await fork.update(addRecordD);
    await store.update(addRecordC);
    await fork.update(addRecordE);

    fork.rebase();

    assert.deepEqual(fork.getAllTransforms(), [addRecordD, addRecordE]);

    assert.deepEqual(fork.cache.findRecords('planet').length, 5);
    assert.ok(fork.cache.includesRecord(recordA.type, recordA.id));
    assert.ok(fork.cache.includesRecord(recordB.type, recordB.id));
    assert.ok(fork.cache.includesRecord(recordC.type, recordC.id));
    assert.ok(fork.cache.includesRecord(recordD.type, recordD.id));
    assert.ok(fork.cache.includesRecord(recordE.type, recordE.id));
  });

  test('#reset - clears the state of a store without a base', async function (assert) {
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

    const tb = store.transformBuilder;
    const addRecordA = buildTransform(tb.addRecord(recordA));
    const addRecordB = buildTransform(tb.addRecord(recordB));

    await store.update(addRecordA);
    await store.update(addRecordB);

    await store.reset();

    assert.deepEqual(store.getAllTransforms(), []);
    assert.deepEqual(store.cache.findRecords('planet').length, 0);
  });

  test('#reset - resets a fork to its base state', async function (assert) {
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

    const tb = store.transformBuilder;
    const addRecordA = buildTransform(tb.addRecord(recordA));
    const addRecordB = buildTransform(tb.addRecord(recordB));
    const addRecordC = buildTransform(tb.addRecord(recordC));
    const addRecordD = buildTransform(tb.addRecord(recordD));
    const addRecordE = buildTransform(tb.addRecord(recordE));

    await store.update(addRecordA);
    await store.update(addRecordB);

    const fork = store.fork();

    await fork.update(addRecordD);
    await store.update(addRecordC);
    await fork.update(addRecordE);

    await fork.reset();

    assert.deepEqual(fork.getAllTransforms(), []);

    assert.deepEqual(fork.cache.findRecords('planet').length, 3);
    assert.ok(fork.cache.includesRecord(recordA.type, recordA.id));
    assert.ok(fork.cache.includesRecord(recordB.type, recordB.id));
    assert.ok(fork.cache.includesRecord(recordC.type, recordC.id));
  });

  // deprecated
  test('#findRecordByKey (deprecated) - can find a previously added record by key', async function (assert) {
    const earth = await store.addRecord({
      type: 'planet',
      name: 'Earth',
      remoteId: 'p01',
    });
    const record = await store.findRecordByKey('planet', 'remoteId', 'p01');
    assert.strictEqual(record, earth);
  });

  // deprecated
  test('#findRecordByKey (deprecated) - will generate a local id for a record that has not been added yet', async function (assert) {
    const schema = store.source.schema;
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const prevFn = schema.generateId;
    schema.generateId = () => 'abc';

    const result = await store.findRecordByKey('planet', 'remoteId', 'p01');
    assert.strictEqual(result, undefined);

    assert.strictEqual(
      store.source.keyMap!.keyToId('planet', 'remoteId', 'p01'),
      'abc',
    );
    schema.generateId = prevFn;
  });

  // deprecated
  test('#peekRecord (deprecated) - existing record', async function (assert) {
    const jupiter = await store.addRecord({ type: 'planet', name: 'Jupiter' });
    assert.strictEqual(
      store.peekRecord('planet', jupiter.id),
      jupiter,
      'retrieved record',
    );
  });

  // deprecated
  test('#peekRecord (deprecated) - missing record', function (assert) {
    assert.strictEqual(store.peekRecord('planet', 'fake'), undefined);
  });

  // deprecated
  test('#peekRecordByKey (deprecated) - existing record', async function (assert) {
    const jupiter = await store.addRecord({
      type: 'planet',
      name: 'Jupiter',
      remoteId: 'p01',
    });
    assert.strictEqual(
      store.peekRecordByKey('planet', 'remoteId', 'p01'),
      jupiter,
      'retrieved record',
    );
  });

  // deprecated
  test('#peekRecordByKey (deprecated) - missing record', function (assert) {
    assert.strictEqual(
      store.keyMap!.keyToId('planet', 'remoteId', 'p01'),
      undefined,
      'key is not in map',
    );
    assert.strictEqual(
      store.peekRecordByKey('planet', 'remoteId', 'p01'),
      undefined,
    );
    assert.notStrictEqual(
      store.keyMap!.keyToId('planet', 'remoteId', 'p01'),
      undefined,
      'id has been generated for key',
    );
  });

  // deprecated
  test('#peekRecords (deprecated)', async function (assert) {
    const earth = await store.addRecord({ type: 'planet', name: 'Earth' });
    const jupiter = await store.addRecord({ type: 'planet', name: 'Jupiter' });
    await store.addRecord({ type: 'moon', name: 'Io' });

    const planets = store.peekRecords('planet');
    assert.strictEqual(planets.length, 2);
    assert.ok(planets.includes(earth));
    assert.ok(planets.includes(jupiter));
  });

  // deprecated
  test('#find (deprecated) - by type', async function (assert) {
    const earth = await store.addRecord<Planet>({
      type: 'planet',
      name: 'Earth',
    });
    const jupiter = await store.addRecord<Planet>({
      type: 'planet',
      name: 'Jupiter',
    });

    const records = (await store.find('planet')) as Planet[];
    assert.strictEqual(records.length, 2);
    assert.ok(records.includes(earth));
    assert.ok(records.includes(jupiter));
  });

  // deprecated
  test('#find (deprecated) - by type and id', async function (assert) {
    const earth = await store.addRecord({ type: 'planet', name: 'Earth' });
    await store.addRecord({ type: 'planet', name: 'Jupiter' });
    const record = await store.find('planet', earth.id);

    assert.strictEqual(record, earth);
  });

  // deprecated
  test('#find (deprecated) - missing record', async function (assert) {
    const record = await store.find('planet', 'jupiter');
    assert.strictEqual(
      record,
      undefined,
      'undefined returned when record cannot be found',
    );
  });

  // deprecated
  test('#find (deprecated) - missing record (raises exception)', async function (assert) {
    try {
      await store.find('planet', 'jupiter', { raiseNotFoundExceptions: true });
    } catch (e) {
      assert.strictEqual(
        (e as Error).message,
        'Record not found: planet:jupiter',
        'query - error caught',
      );
    }
  });
});
