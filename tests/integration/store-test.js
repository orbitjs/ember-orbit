import { dummyModels } from 'dummy/tests/support/dummy-models';
import { createStore } from 'dummy/tests/support/store';
import qb from 'orbit/query/builder';
import {
  replaceAttribute
} from 'orbit/transform/operators';

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

  test('#addRecord', function(assert) {
    return store.addRecord({ type: 'planet', name: 'Earth' })
      .then(function(planet) {
         assert.ok(planet instanceof Planet);
         assert.ok(get(planet, 'id'), 'assigned id');
         assert.equal(get(planet, 'name'), 'Earth');
      });
  });

  test('#findRecord', function(assert) {
    return store.addRecord({ type: 'planet', name: 'Earth' })
      .then( record => store.findRecord('planet', record.get('id')))
      .then( planet => {
        assert.ok(planet instanceof Planet);
        assert.ok(get(planet, 'id'), 'assigned id');
        assert.equal(get(planet, 'name'), 'Earth');
      });
  });

  test('#findRecord - missing record', function(assert) {
    return store.findRecord('planet', 'jupiter')
      .catch(e => {
        assert.equal(e.message, 'Record not found - planet:jupiter', 'query - error caught');
      });
  });

  test('#removeRecord', function(assert) {
    return store.addRecord({ type: 'planet', name: 'Earth' })
      .tap(record => store.removeRecord(record))
      .then(record => store.findRecord('planet', record.get('id')))
      .catch(error => {
        assert.ok(error.message.match(/Record not found/));
      });
  });

  test('#query - record', function(assert) {
    let earth;

    return Ember.RSVP.Promise.all([
      store.addRecord({ type: 'planet', name: 'Earth' })
    ])
      .then(([result1]) => {
        earth = result1;
        return store.query(qb.record(earth));
      })
      .then(record => {
        assert.strictEqual(record, earth);
      });
  });

  test('#query - records', function(assert) {
    let earth, jupiter;

    return Ember.RSVP.Promise.all([
      store.addRecord({ type: 'planet', name: 'Earth' }),
      store.addRecord({ type: 'planet', name: 'Jupiter' })
    ])
      .then(([result1, result2]) => {
        earth = result1;
        jupiter = result2;
        return store.query(qb.records('planet'));
      })
      .then(records => {
        assert.deepEqual(records, [earth, jupiter]);
        assert.strictEqual(records[0], earth);
        assert.strictEqual(records[1], jupiter);
      });
  });

  test('#query - relatedRecord', function(assert) {
    let sun, jupiter;

    return store.addRecord({type: 'star', name: 'The Sun'})
      .then(result => {
        sun = result;
        return store.addRecord({ type: 'planet', name: 'Jupiter', sun });
      })
      .then(result => {
        jupiter = result;
        return store.query(qb.relatedRecord(jupiter.identity, 'sun'));
      })
      .then(record => {
        assert.strictEqual(record, sun);
      });
  });

  test('#query - relatedRecords', function(assert) {
    let io, callisto, jupiter;

    return Ember.RSVP.Promise.all([
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
        return store.query(qb.relatedRecords(jupiter.identity, 'moons'));
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
        return store.query(qb.records('planet').filterAttributes({ name: 'Earth' }));
      })
      .then(records => {
        assert.deepEqual(records, [earth]);
        assert.strictEqual(records[0], earth);
      });
  });

  test('liveQuery - adds record that becomes a match', function(assert) {
    store.addRecord({ id: 'jupiter', type: 'planet', attributes: { name: 'Jupiter2' } });
    const liveQuery = store.liveQuery(qb.records('planet')
                                        .filterAttributes({ name: 'Jupiter' }));

    assert.equal(liveQuery.get('length'), 0);

    return store.update(replaceAttribute({ type: 'planet', id: 'jupiter' }, 'name', 'Jupiter'))
      .then(() => {
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
        assert.deepEqual(records, [earth, jupiter]);
        assert.strictEqual(records[0], earth);
        assert.strictEqual(records[1], jupiter);
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
        assert.equal(e.message, 'Record not found - planet:jupiter', 'query - error caught');
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
