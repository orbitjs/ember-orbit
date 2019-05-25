import { Planet, Moon, Star } from 'dummy/tests/support/dummy-models';
import { createStore } from 'dummy/tests/support/store';
import { buildTransform } from '@orbit/data';
import { module, test } from 'qunit';

module('Integration - Store', function(hooks) {
  let store;
  const models = { planet: Planet, moon: Moon, star: Star };

  hooks.beforeEach(function() {
    store = createStore({ models });
  });

  hooks.afterEach(function() {
    store = null;
  });

  test('#addRecord', async function(assert) {
    const planet = await store.addRecord({ type: 'planet', name: 'Earth' });

    assert.ok(planet instanceof Planet);
    assert.ok(planet.id, 'assigned id');
    assert.equal(planet.name, 'Earth');
  });

  test('#addRecord - with blocking sync updates', async function(assert) {
    store.source.on('beforeUpdate', transform => {
      return store.source.sync(transform);
    });

    const planet = await store.addRecord({ type: 'planet', name: 'Earth' });
    assert.ok(planet instanceof Planet);
    assert.ok(planet.id, 'assigned id');
    assert.equal(planet.name, 'Earth');
  });

  test('#findRecord', async function(assert) {
    const earth = await store.addRecord({ type: 'planet', name: 'Earth' });
    const planet = await store.findRecord('planet', earth.id);
    assert.strictEqual(planet, earth);
  });

  test('#findRecord - missing record', async function(assert) {
    try {
      await store.findRecord('planet', 'jupiter');
    } catch (e) {
      assert.equal(e.message, 'Record not found: planet:jupiter');
    }
  });

  test('#findRecordByKey - can find a previously added record by key', async function(assert) {
    const earth = await store.addRecord({
      type: 'planet',
      name: 'Earth',
      remoteId: 'p01'
    });
    const record = await store.findRecordByKey('planet', 'remoteId', 'p01');
    assert.strictEqual(record, earth);
  });

  test('#findRecordByKey - will generate a local id for a record that has not been added yet', async function(assert) {
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

  test('#removeRecord - when passed a record, it should serialize its identity in a `removeRecord` op', async function(assert) {
    assert.expect(2);

    const record = await store.addRecord({ type: 'planet', name: 'Earth' });

    store.on('update', data => {
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

  test('#removeRecord - when passed an identity', async function(assert) {
    assert.expect(2);

    const record = await store.addRecord({ type: 'planet', name: 'Earth' });

    store.on('update', data => {
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

  test('#getTransform - returns a particular transform given an id', async function(assert) {
    const recordA = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter' }
    };

    const addRecordATransform = buildTransform(
      store.source.transformBuilder.addRecord(recordA)
    );

    await store.sync(addRecordATransform);
    assert.strictEqual(
      store.getTransform(addRecordATransform.id),
      addRecordATransform
    );
  });

  test('#getInverseOperations - returns the inverse operations for a particular transform', async function(assert) {
    const recordA = {
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter' }
    };

    const addRecordATransform = buildTransform(
      store.source.transformBuilder.addRecord(recordA)
    );

    await store.sync(addRecordATransform);

    assert.deepEqual(store.getInverseOperations(addRecordATransform.id), [
      { op: 'removeRecord', record: { id: 'jupiter', type: 'planet' } }
    ]);
  });

  test('replacing a record invalidates attributes and relationships', async function(assert) {
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

    await store.update(t =>
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

  test('#query - findRecord', async function(assert) {
    const earth = await store.addRecord({ type: 'planet', name: 'Earth' });
    const record = await store.query(q => q.findRecord(earth));
    assert.strictEqual(record, earth);
  });

  test('#query - findRecords', async function(assert) {
    const earth = await store.addRecord({ type: 'planet', name: 'Earth' });
    const jupiter = await store.addRecord({ type: 'planet', name: 'Jupiter' });
    const records = await store.query(q => q.findRecords('planet'));

    assert.equal(records.length, 2);
    assert.ok(records.includes(earth));
    assert.ok(records.includes(jupiter));
  });

  test('#query - findRelatedRecord', async function(assert) {
    const sun = await store.addRecord({ type: 'star', name: 'The Sun' });
    const jupiter = await store.addRecord({
      type: 'planet',
      name: 'Jupiter',
      sun
    });
    const record = await store.query(q =>
      q.findRelatedRecord(jupiter.identity, 'sun')
    );
    assert.strictEqual(record, sun);
  });

  test('#query - findRelatedRecords', async function(assert) {
    const io = await store.addRecord({ type: 'moon', name: 'Io' });
    const callisto = await store.addRecord({ type: 'moon', name: 'Callisto' });
    const jupiter = await store.addRecord({
      type: 'planet',
      name: 'Jupiter',
      moons: [io, callisto]
    });
    const records = await store.query(q =>
      q.findRelatedRecords(jupiter.identity, 'moons')
    );

    assert.deepEqual(records, [io, callisto]);
    assert.strictEqual(records[0], io);
    assert.strictEqual(records[1], callisto);
  });

  test('#query - filter', async function(assert) {
    const earth = await store.addRecord({ type: 'planet', name: 'Earth' });
    await store.addRecord({ type: 'planet', name: 'Jupiter' });
    const records = await store.query(q =>
      q.findRecords('planet').filter({ attribute: 'name', value: 'Earth' })
    );

    assert.deepEqual(records, [earth]);
    assert.strictEqual(records[0], earth);
  });

  test('liveQuery - adds record that becomes a match', async function(assert) {
    store.addRecord({
      id: 'jupiter',
      type: 'planet',
      attributes: { name: 'Jupiter2' }
    });

    let liveQuery = await store.liveQuery(q =>
      q.findRecords('planet').filter({ attribute: 'name', value: 'Jupiter' })
    );
    assert.equal(liveQuery.length, 0);

    await store.update(t =>
      t.replaceAttribute({ type: 'planet', id: 'jupiter' }, 'name', 'Jupiter')
    );
    assert.equal(liveQuery.length, 1);
  });

  test('#find - by type', async function(assert) {
    let earth = await store.addRecord({ type: 'planet', name: 'Earth' });
    let jupiter = await store.addRecord({ type: 'planet', name: 'Jupiter' });

    let records = await store.find('planet');
    assert.equal(records.length, 2);
    assert.ok(records.includes(earth));
    assert.ok(records.includes(jupiter));
  });

  test('#find - by type and id', async function(assert) {
    const earth = await store.addRecord({ type: 'planet', name: 'Earth' });
    await store.addRecord({ type: 'planet', name: 'Jupiter' });
    const record = await store.find('planet', earth.id);

    assert.strictEqual(record, earth);
  });

  test('#find - missing record', async function(assert) {
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

  test('#fork - creates a clone of a base store', async function(assert) {
    const forkedStore = store.fork();
    const jupiter = await forkedStore.addRecord({
      type: 'planet',
      name: 'Jupiter',
      classification: 'gas giant'
    });

    assert.notOk(
      store.cache.includesRecord('planet', jupiter.id),
      'store does not contain record'
    );
    assert.ok(
      forkedStore.cache.includesRecord('planet', jupiter.id),
      'fork includes record'
    );
  });

  test('#merge - merges a forked store back into a base store', async function(assert) {
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
});
