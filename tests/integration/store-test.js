import { dummyModels } from 'dummy/tests/support/dummy-models';
import { createStore } from 'dummy/tests/support/store';

const { Planet, Moon, Star } = dummyModels;
const { get } = Ember;

module('Integration - Store', function(hooks) {
  let store;

  hooks.beforeEach(function() {
    const models = { planet: Planet, moon: Moon, star: Star };
    store = createStore({ models });
  });

  hooks.afterEach(function() {
    store = null;
  });

  test('#addRecord', async assert => {
    const planet = await store.addRecord({ type: 'planet', name: 'Earth' });
    assert.ok(planet instanceof Planet);
    assert.ok(get(planet, 'id'), 'assigned id');
    assert.equal(get(planet, 'name'), 'Earth');
  });

  test('#findRecord', async assert => {
    const record = await store.addRecord({ type: 'planet', name: 'Earth' });
    const planet = await store.findRecord('planet', record.get('id'));
    assert.ok(planet instanceof Planet);
    assert.ok(get(planet, 'id'), 'assigned id');
    assert.equal(get(planet, 'name'), 'Earth');
  });

  test('#removeRecord', async assert => {
    const record = await store.addRecord({ type: 'planet', name: 'Earth' });
    await store.removeRecord(record);

    try {
      await store.findRecord('planet', record.get('id'));
    }
    catch(error) {
      assert.ok(error.message.match(/Record not found/));
    }
  });

  test('#query - record', async assert => {
    const earth = await store.addRecord({ type: 'planet', name: 'Earth' });
    const record = await store.query(q => q.record(earth));
    assert.strictEqual(record, earth);
  });

  test('#query - recordsOfType', async assert => {
    const earth = await store.addRecord({ type: 'planet', name: 'Earth' });
    const jupiter = await store.addRecord({ type: 'planet', name: 'Jupiter' });
    const records = await store.query(q => q.recordsOfType('planet'));
    assert.deepEqual(records, [earth, jupiter]);
    assert.strictEqual(records[0], earth);
    assert.strictEqual(records[1], jupiter);
  });

  test('#query - filter', async assert => {
    const earth = await store.addRecord({ type: 'planet', name: 'Earth' });
    const records = await store.query(q => q.recordsOfType('planet').filterAttributes({ name: 'Earth' }));
    assert.deepEqual(records, [earth]);
    assert.strictEqual(records[0], earth);
  });

  test('#find - by type and id', async assert => {
    const earth = await store.addRecord({ type: 'planet', name: 'Earth' });
    const record = await store.find('planet', earth.id);
    assert.strictEqual(record, earth);
  });

  test('#find - by type', async assert => {
    const earth = await store.addRecord({ type: 'planet', name: 'Earth' });
    const jupiter = await store.addRecord({ type: 'planet', name: 'Jupiter' });
    const records = await store.find('planet');
    assert.strictEqual(records[0], earth);
    assert.strictEqual(records[1], jupiter);
  });
});
