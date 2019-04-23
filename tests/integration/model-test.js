import EmberError from '@ember/error';
import EmberObject from '@ember/object';
import { Planet, Moon, Star } from 'dummy/tests/support/dummy-models';
import { createStore } from 'dummy/tests/support/store';
import { module, test } from 'qunit';
import { getOwner } from '@ember/application';
import { waitForSource } from 'ember-orbit/test-support';

module('Integration - Model', function(hooks) {
  let store;

  hooks.beforeEach(function() {
    const models = { planet: Planet, moon: Moon, star: Star };
    store = createStore({ models });
  });

  hooks.afterEach(function() {
    store = null;
  });

  test('models are assigned the same owner as the store', async function(assert) {
    const model = await store.addRecord({type: 'star', name: 'The Sun'});
    assert.ok(getOwner(model), 'model has an owner');
    assert.strictEqual(getOwner(model), getOwner(store), 'model has same owner as store');
  });

  test('models can receive registered injections', async function(assert) {
    const Foo = EmberObject.extend({
      bar: 'bar'
    });

    const app = getOwner(store);
    app.register('service:foo', Foo);
    app.inject('model:star', 'foo', 'service:foo');

    const model = await store.addRecord({type: 'star', name: 'The Sun'});
    assert.ok(model.get('foo'), 'service has been injected');
    assert.equal(model.foo.bar, 'bar', 'service is correct');
  });

  test('add new model', async function(assert) {
    const theSun = await store.addRecord({type: 'star', name: 'The Sun'});
    const callisto = await store.addRecord({type: 'moon', name: 'Callisto'});
    const record = await store.addRecord({type: 'planet', remoteId: 'planet:jupiter', name: 'Jupiter', sun: theSun, moons: [callisto]});

    assert.ok(record.get('id'), 'assigned id');
    assert.deepEqual(record.get('identity'), { id: record.get('id'), type: 'planet' }, 'assigned identity that includes type and id');
    assert.equal(record.get('name'), 'Jupiter', 'assigned specified attribute');
    assert.equal(record.get('remoteId'), 'planet:jupiter', 'assigned secondary key');
    assert.strictEqual(record.get('sun'), theSun, 'assigned hasOne');
    assert.strictEqual(record.get('moons.firstObject'), callisto, 'assigned hasMany');
  });

  test('remove model', async function(assert) {
    const cache = store.get('cache');

    const record = await store.addRecord({type: 'star', name: 'The Sun'});
    await record.remove();

    assert.ok(!cache.retrieveRecord('star', record.id), 'record does not exist in cache');
    assert.ok(record.get('disconnected'), 'record has been disconnected from store');
    assert.throws(() => record.get('name'), EmberError, 'record has been removed from Store');
  });

  test('add to hasMany', async function(assert) {
    const jupiter = await store.addRecord({type: 'planet', name: 'Jupiter'});
    const callisto = await store.addRecord({type: 'moon', name: 'Callisto'});

    await jupiter.get('moons').pushObject(callisto);

    assert.ok(jupiter.get('moons').includes(callisto), 'added record to hasMany');
    assert.equal(callisto.get('planet'), jupiter, 'updated inverse');
  });

  test('remove from hasMany', async function(assert) {
    const jupiter = await store.addRecord({type: 'planet', name: 'Jupiter'});
    const callisto = await store.addRecord({type: 'moon', name: 'Callisto'});

    await jupiter.get('moons').pushObject(callisto);
    await jupiter.get('moons').removeObject(callisto);

    assert.ok(!jupiter.get('moons').includes(callisto), 'removed record from hasMany');
    assert.ok(!callisto.get('planet'), 'updated inverse');
  });

  test('replaceRelatedRecords operation invalidates a relationship on model', async function(assert) {
    const jupiter = await store.addRecord({type: 'planet', name: 'Jupiter'});
    const callisto = await store.addRecord({type: 'moon', name: 'Callisto'});

    assert.deepEqual(jupiter.get('moons').content, []); // cache the relationship
    await store.source.update(t => t.replaceRelatedRecords(jupiter, 'moons', [callisto]));
    assert.deepEqual(jupiter.get('moons').content, [callisto], 'invalidates the relationship');
  });

  test('replace hasOne with record', async function(assert) {
    const jupiter = await store.addRecord({type: 'planet', name: 'Jupiter'});
    const callisto = await store.addRecord({type: 'moon', name: 'Callisto'});

    callisto.set('planet', jupiter);
    await waitForSource(store);

    assert.equal(callisto.get('planet'), jupiter, 'replaced hasOne with record');
    assert.ok(jupiter.get('moons').includes(callisto), 'updated inverse');
  });

  test('replaceRelatedRecord operation invalidates a relationship on model', async function(assert) {
    const jupiter = await store.addRecord({type: 'planet', name: 'Jupiter' });
    const sun = await store.addRecord({type: 'star', name: 'Sun' });

    assert.equal(jupiter.get('sun'), null); // cache the relationship
    await store.source.update(t => t.replaceRelatedRecord(jupiter, 'sun', sun));
    assert.equal(jupiter.get('sun'), sun, 'invalidates the relationship');
  });

  test('replace hasOne with null', async function(assert) {
    const jupiter = await store.addRecord({type: 'planet', name: 'Jupiter'});
    const callisto = await store.addRecord({type: 'moon', name: 'Callisto'});

    callisto.set('planet', jupiter);
    await waitForSource(store);

    callisto.set('planet', null);
    await waitForSource(store);

    assert.equal(callisto.get('planet'), null, 'replaced hasOne with null');
    assert.ok(!jupiter.get('moons').includes(callisto), 'removed from inverse hasMany');
  });

  test('replace attribute on model', async function(assert) {
    const record = await store.addRecord({type: 'planet', name: 'Jupiter'});
    record.set('name', 'Jupiter2');
    assert.equal(record.get('name'), 'Jupiter2');
  });

  test('replaceAttribute operation invalidates attribute on model', async function(assert) {
    const record = await store.addRecord({type: 'planet', name: 'Jupiter'});
    assert.equal(record.get('name'), 'Jupiter'); // cache the name
    await store.update(t => t.replaceAttribute(record, 'name', 'Jupiter2'));
    assert.equal(record.get('name'), 'Jupiter2');
  });

  test('replace attributes on model', async function(assert) {
    const record = await store.addRecord({ type: 'planet', name: 'Jupiter' });
    await record.replaceAttributes({ name: 'Jupiter2', classification: 'gas giant2' });

    assert.equal(record.get('name'), 'Jupiter2');
    assert.equal(record.get('classification'), 'gas giant2');
  });

  test('replace key', async function(assert) {
    const record = await store.addRecord({type: 'planet', name: 'Jupiter', remoteId: 'planet:jupiter'});
    record.set('remoteId', 'planet:joopiter');
    assert.equal(record.get('remoteId'), 'planet:joopiter');
  });

  test('replaceKey operation invalidates key on model', async function(assert) {
    const record = await store.addRecord({type: 'planet', name: 'Jupiter', remoteId: 'planet:jupiter'});
    assert.equal(record.get('remoteId'), 'planet:jupiter'); // cache the key
    await store.update(t => t.replaceKey(record, 'remoteId', 'planet:joopiter'));
    assert.equal(record.get('remoteId'), 'planet:joopiter');
  });

  test('destroy model', async function(assert) {
    const cache = store.get('cache');

    const record = await store.addRecord({type: 'planet', name: 'Jupiter'});
    const identifier = record.getProperties('type', 'id');
    record.destroy();

    await waitForSource(store);

    assert.ok(!cache.get('_identityMap').includes(identifier), 'removed from identity map');
  });

  test('getData returns underlying record data', async function(assert){
    const record = await store.addRecord({type: 'planet', name: 'Jupiter'});
    let recordData = record.getData();
    assert.equal(recordData.attributes.name, 'Jupiter', 'returns record data (resource)');
  });
});
