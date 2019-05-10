import { Promise as EmberPromise } from 'rsvp';
import { get } from '@ember/object';
import { Planet, Moon, Star } from 'dummy/tests/support/dummy-models';
import { createStore } from 'dummy/tests/support/store';
import {
  buildTransform
} from '@orbit/data';
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

  test('#addRecord', function(assert) {
    return store.addRecord({ type: 'planet', name: 'Earth' })
      .then(function(planet) {
         assert.ok(planet instanceof Planet);
         assert.ok(get(planet, 'id'), 'assigned id');
         assert.equal(get(planet, 'name'), 'Earth');
      });
  });

  test('#addRecord - with blocking sync updates', function(assert) {
    store.source.on('beforeUpdate', (transform) => {
      return store.source.sync(transform);
    });

    return store.addRecord({ type: 'planet', name: 'Earth' })
      .then(function(planet) {
         assert.ok(planet instanceof Planet);
         assert.ok(get(planet, 'id'), 'assigned id');
         assert.equal(get(planet, 'name'), 'Earth');
      });
  });

  test('#findRecord', function(assert) {
    return store.addRecord({ type: 'planet', name: 'Earth' })
      .then( record => store.findRecord('planet', record.id))
      .then( planet => {
        assert.ok(planet instanceof Planet);
        assert.ok(get(planet, 'id'), 'assigned id');
        assert.equal(get(planet, 'name'), 'Earth');
      });
  });

  test('#findRecord - missing record', function(assert) {
    return store.findRecord('planet', 'jupiter')
      .catch(e => {
        assert.equal(e.message, 'Record not found: planet:jupiter');
      });
  });

  test('#findRecordByKey - can find a previously added record by key', function(assert) {
    return store.addRecord({ type: 'planet', name: 'Earth', remoteId: 'p01' })
      .then( () => store.findRecordByKey('planet', 'remoteId', 'p01'))
      .then( planet => {
        assert.ok(planet instanceof Planet);
        assert.ok(get(planet, 'id'), 'assigned id');
        assert.equal(get(planet, 'name'), 'Earth');
      });
  });

  test('#findRecordByKey - will generate a local id for a record that has not been added yet', function(assert) {
    let schema = store.source.schema;
    let prevFn = schema.generateId;
    schema.generateId = () => 'abc';
    return store.findRecordByKey('planet', 'remoteId', 'p01')
      .catch(e => {
        assert.equal(store.source.keyMap.keyToId('planet', 'remoteId', 'p01'), 'abc');
        assert.equal(e.message, 'Record not found: planet:abc');
        schema.generateId = prevFn;
      });
  });

  test('#removeRecord - when passed a record, it should serialize its identity in a `removeRecord` op', async function(assert) {
    assert.expect(2);

    let record = await store.addRecord({ type: 'planet', name: 'Earth' });

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
    } catch(error) {
      assert.ok(error.message.match(/Record not found/));
    }
  });

  test('#removeRecord - when passed an identity', async function(assert) {
    assert.expect(2);

    let record = await store.addRecord({ type: 'planet', name: 'Earth' });

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
    } catch(error) {
      assert.ok(error.message.match(/Record not found/));
    }
  });

  test('#getTransform - returns a particular transform given an id', function(assert) {
    const recordA = { id: 'jupiter', type: 'planet', attributes: { name: 'Jupiter' } };

    const addRecordATransform = buildTransform(store.source.transformBuilder.addRecord(recordA));

    return store.sync(addRecordATransform)
      .then(() => {
        assert.strictEqual(store.getTransform(addRecordATransform.id), addRecordATransform);
     });
  });

  test('#getInverseOperations - returns the inverse operations for a particular transform', function(assert) {
    const recordA = { id: 'jupiter', type: 'planet', attributes: { name: 'Jupiter' } };

    const addRecordATransform = buildTransform(store.source.transformBuilder.addRecord(recordA));

    return store.sync(addRecordATransform)
      .then(() => {
        assert.deepEqual(store.getInverseOperations(addRecordATransform.id), [
          { op: 'removeRecord', record: { id: 'jupiter', type: 'planet' } }
        ]);
     });
  });

  test('replacing a record invalidates attributes and relationships', function(assert) {
    return EmberPromise.all([
      store.addRecord({ type: 'planet', id: 'p1', name: 'Earth' }),
      store.addRecord({type: 'star', id: 's1', name: 'The Sun'})
    ])
      .tap(([planet, star]) => {
        assert.equal(get(planet, 'name'), 'Earth', 'initial attribute get is fine');
        assert.equal(get(planet, 'sun'), null, 'initial hasOne get is fine');
        assert.equal(get(star, 'name'), 'The Sun', 'star has been created properly');
      })
      .tap(([planet, star]) => store.update(t =>
        t.updateRecord({ type: 'planet', id: planet.id, attributes: { name: 'Jupiter' }, relationships: { sun: { data: { type: 'star', id: star.id } } } }))
      )
      .then(([planet, star]) => {
        assert.strictEqual(get(planet, 'name'), 'Jupiter', 'attribute has been reset');
        assert.strictEqual(get(planet, 'sun'), star, 'hasOne has been reset');
      });
  });

  test('#query - findRecord', function(assert) {
    let earth;

    return EmberPromise.all([
      store.addRecord({ type: 'planet', name: 'Earth' })
    ])
      .then(([result1]) => {
        earth = result1;
        return store.query(q => q.findRecord(earth));
      })
      .then(record => {
        assert.strictEqual(record, earth);
      });
  });

  test('#query - findRecords', function(assert) {
    let earth, jupiter;

    return EmberPromise.all([
      store.addRecord({ type: 'planet', name: 'Earth' }),
      store.addRecord({ type: 'planet', name: 'Jupiter' })
    ])
      .then(([result1, result2]) => {
        earth = result1;
        jupiter = result2;
        return store.query(q => q.findRecords('planet'));
      })
      .then(records => {
        assert.equal(records.length, 2);
        assert.ok(records.indexOf(earth) > -1);
        assert.ok(records.indexOf(jupiter) > -1);
      });
  });

  test('#query - findRelatedRecord', function(assert) {
    let sun, jupiter;

    return store.addRecord({type: 'star', name: 'The Sun'})
      .then(result => {
        sun = result;
        return store.addRecord({ type: 'planet', name: 'Jupiter', sun });
      })
      .then(result => {
        jupiter = result;
        return store.query(q => q.findRelatedRecord(jupiter.identity, 'sun'));
      })
      .then(record => {
        assert.strictEqual(record, sun);
      });
  });

  test('#query - findRelatedRecords', function(assert) {
    let io, callisto, jupiter;

    return EmberPromise.all([
      store.addRecord({type: 'moon', name: 'Io'}),
      store.addRecord({type: 'moon', name: 'Callisto'})
    ])
      .then(([result1, result2]) => {
        io = result1;
        callisto = result2;
        return store.addRecord({ type: 'planet', name: 'Jupiter', moons: [io, callisto] });
      })
      .then(result => {
        jupiter = result;
        return store.query(q => q.findRelatedRecords(jupiter.identity, 'moons'));
      })
      .then(records => {
        assert.deepEqual(records, [io, callisto]);
        assert.strictEqual(records[0], io);
        assert.strictEqual(records[1], callisto);
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
        return store.query(q => q.findRecords('planet').filter({ attribute: 'name', value: 'Earth' }));
      })
      .then(records => {
        assert.deepEqual(records, [earth]);
        assert.strictEqual(records[0], earth);
      });
  });

  test('liveQuery - adds record that becomes a match', function(assert) {
    store.addRecord({ id: 'jupiter', type: 'planet', attributes: { name: 'Jupiter2' } });

    return store.liveQuery(q => q.findRecords('planet').filter({ attribute: 'name', value: 'Jupiter' }))
      .tap(liveQuery => {
        assert.equal(liveQuery.get('length'), 0);
        return store.update(t => t.replaceAttribute({ type: 'planet', id: 'jupiter' }, 'name', 'Jupiter'));
      })
      .then(liveQuery => {
        assert.equal(liveQuery.get('length'), 1);
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
        return store.find('planet');
      })
      .then(records => {
        assert.equal(records.length, 2);
        assert.ok(records.indexOf(earth) > -1);
        assert.ok(records.indexOf(jupiter) > -1);
      });
  });

  test('#find - by type and id', function(assert) {
    let earth;

    return store.addRecord({ type: 'planet', name: 'Earth' })
      .then(record => {
        earth = record;
        return store.addRecord({ type: 'planet', name: 'Jupiter' });
      })
      .then(() => store.find('planet', earth.id))
      .then(record => assert.strictEqual(record, earth));
  });

  test('#find - missing record', function(assert) {
    return store.find('planet', 'jupiter')
      .catch(e => {
        assert.equal(e.message, 'Record not found: planet:jupiter', 'query - error caught');
      });
  });

  test("#fork - creates a clone of a base store", function(assert) {
    const forkedStore = store.fork();

    return forkedStore
      .addRecord({type: 'planet', name: 'Jupiter', classification: 'gas giant'})
      .then(jupiter => {
        assert.equal(store.cache.includesRecord('planet', jupiter.get('id')), false, 'store does not contain record');
        assert.equal(forkedStore.cache.includesRecord('planet', jupiter.get('id')), true, 'fork includes record');
      });
  });

  test("#merge - merges a forked store back into a base store", function(assert) {
    const forkedStore = store.fork();

    return forkedStore
      .addRecord({type: 'planet', name: 'Jupiter', classification: 'gas giant'})
      .tap(() => store.merge(forkedStore))
      .then(jupiter => {
        assert.equal(store.cache.includesRecord('planet', jupiter.get('id')), true, 'store includes record');
        assert.equal(forkedStore.cache.includesRecord('planet', jupiter.get('id')), true, 'fork includes record');
      });
  });
});
