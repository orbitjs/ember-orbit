import EmberObject from '@ember/object';
import {
  Planet,
  Moon,
  Star,
  BinaryStar,
  PlanetarySystem
} from 'dummy/tests/support/dummy-models';
import { createStore } from 'dummy/tests/support/store';
import { module, test } from 'qunit';
import { getOwner } from '@ember/application';
import { waitForSource } from 'ember-orbit/test-support';

module('Integration - Model', function (hooks) {
  let store;

  hooks.beforeEach(function () {
    const models = {
      planet: Planet,
      moon: Moon,
      star: Star,
      binaryStar: BinaryStar,
      planetarySystem: PlanetarySystem
    };
    store = createStore({ models }).fork();
  });

  hooks.afterEach(function () {
    store = null;
  });

  test('models are assigned the same owner as the store', async function (assert) {
    const model = await store.addRecord({ type: 'star', name: 'The Sun' });
    assert.ok(getOwner(model), 'model has an owner');
    assert.strictEqual(
      getOwner(model),
      getOwner(store),
      'model has same owner as store'
    );
  });

  test('models can receive registered injections', async function (assert) {
    const Foo = EmberObject.extend({
      bar: 'bar'
    });

    const app = getOwner(store);
    app.register('service:foo', Foo);
    app.inject('data-model:star', 'foo', 'service:foo');

    const model = await store.addRecord({ type: 'star', name: 'The Sun' });
    assert.ok(model.foo, 'service has been injected');
    assert.equal(model.foo.bar, 'bar', 'service is correct');
  });

  test('models can be added to the store', async function (assert) {
    const theSun = await store.addRecord({ type: 'star', name: 'The Sun' });
    const callisto = await store.addRecord({ type: 'moon', name: 'Callisto' });
    const record = await store.addRecord({
      type: 'planet',
      remoteId: 'planet:jupiter',
      name: 'Jupiter',
      sun: theSun,
      moons: [callisto]
    });

    assert.ok(record.id, 'assigned id');
    assert.deepEqual(
      record.identity,
      { id: record.id, type: 'planet' },
      'assigned identity that includes type and id'
    );
    assert.equal(record.name, 'Jupiter', 'assigned specified attribute');
    assert.equal(record.remoteId, 'planet:jupiter', 'assigned secondary key');
    assert.strictEqual(record.sun, theSun, 'assigned hasOne');
    assert.strictEqual(record.moons[0], callisto, 'assigned hasMany');
  });

  test('models can be removed', async function (assert) {
    const cache = store.cache;
    const record = await store.addRecord({ type: 'star', name: 'The Sun' });
    await record.remove();

    assert.notOk(
      cache.includesRecord('star', record.id),
      'record does not exist in cache'
    );
    assert.ok(record.disconnected, 'record has been disconnected from store');
    assert.throws(
      () => record.name,
      Error,
      'record has been removed from Store'
    );
  });

  test('remove model with relationships', async function (assert) {
    const callisto = await store.addRecord({ type: 'moon', name: 'Callisto' });
    const sun = await store.addRecord({ type: 'star', name: 'Sun' });
    const jupiter = await store.addRecord({
      type: 'planet',
      name: 'Jupiter',
      moons: [callisto],
      sun
    });
    assert.deepEqual(
      jupiter.moons,
      [callisto],
      'moons relationship has been added'
    );
    assert.strictEqual(jupiter.sun, sun, 'sun relationship has been added');

    await jupiter.remove();
  });

  test('add to hasMany', async function (assert) {
    const jupiter = await store.addRecord({ type: 'planet', name: 'Jupiter' });
    const callisto = await store.addRecord({ type: 'moon', name: 'Callisto' });

    await jupiter.addToRelatedRecords('moons', callisto);

    assert.ok(jupiter.moons.includes(callisto), 'added record to hasMany');
    assert.equal(callisto.planet, jupiter, 'updated inverse');
  });

  test('add to polymorphic hasMany', async function (assert) {
    const solarSystem = await store.addRecord({
      type: 'planetarySystem',
      name: 'Home'
    });
    const callisto = await store.addRecord({ type: 'moon', name: 'Callisto' });

    await solarSystem.addToRelatedRecords('bodies', callisto);

    assert.ok(
      solarSystem.bodies.includes(callisto),
      'added record to polymorphic hasMany'
    );
  });

  test('remove from hasMany', async function (assert) {
    const jupiter = await store.addRecord({ type: 'planet', name: 'Jupiter' });
    const callisto = await store.addRecord({ type: 'moon', name: 'Callisto' });

    await jupiter.addToRelatedRecords('moons', callisto);
    await jupiter.removeFromRelatedRecords('moons', callisto);

    assert.ok(!jupiter.moons.includes(callisto), 'removed record from hasMany');
    assert.ok(!callisto.planet, 'updated inverse');
  });

  test('remove from polymorphic hasMany', async function (assert) {
    const solarSystem = await store.addRecord({
      type: 'planetarySystem',
      name: 'Home'
    });
    const callisto = await store.addRecord({ type: 'moon', name: 'Callisto' });

    await solarSystem.addToRelatedRecords('bodies', callisto);
    await solarSystem.removeFromRelatedRecords('bodies', callisto);

    assert.ok(
      !solarSystem.bodies.includes(callisto),
      'removed record to polymorphic hasMany'
    );
  });

  test('update via store: replaceRelatedRecords operation invalidates a relationship on model', async function (assert) {
    const jupiter = await store.addRecord({ type: 'planet', name: 'Jupiter' });
    const callisto = await store.addRecord({ type: 'moon', name: 'Callisto' });

    assert.deepEqual(jupiter.moons, []); // cache the relationship
    await store.source.update((t) =>
      t.replaceRelatedRecords(jupiter, 'moons', [callisto])
    );
    assert.deepEqual(jupiter.moons, [callisto], 'invalidates the relationship');
  });

  test('update via store: replaceRelatedRecords operation invalidates a polymorphic relationship on model', async function (assert) {
    const solarSystem = await store.addRecord({
      type: 'planetarySystem',
      name: 'Home'
    });
    const callisto = await store.addRecord({ type: 'moon', name: 'Callisto' });

    assert.deepEqual(solarSystem.bodies, []); // cache the relationship
    await store.source.update((t) =>
      t.replaceRelatedRecords(solarSystem, 'bodies', [callisto])
    );
    assert.deepEqual(
      solarSystem.bodies,
      [callisto],
      'invalidates the relationship'
    );
  });

  test('replace hasOne with record', async function (assert) {
    const jupiter = await store.addRecord({ type: 'planet', name: 'Jupiter' });
    const callisto = await store.addRecord({ type: 'moon', name: 'Callisto' });

    callisto.planet = jupiter;
    await waitForSource(store);

    assert.equal(callisto.planet, jupiter, 'replaced hasOne with record');
    assert.ok(jupiter.moons.includes(callisto), 'updated inverse');
  });

  test('replace polymorphic hasOne with record', async function (assert) {
    const solarSystem = await store.addRecord({
      type: 'planetarySystem',
      name: 'Home'
    });
    const sun = await store.addRecord({ type: 'star', name: 'Sun' });
    const twinSun = await store.addRecord({
      type: 'binaryStar',
      name: 'Twin Sun'
    });

    solarSystem.star = twinSun;
    await waitForSource(store);

    assert.equal(
      solarSystem.star,
      twinSun,
      'replaced polymorphic hasOne with record'
    );

    solarSystem.star = sun;
    await waitForSource(store);

    assert.equal(
      solarSystem.star,
      sun,
      'replaced polymorphic hasOne with record of another valid type'
    );
  });

  test('update via store: replaceRelatedRecord operation invalidates a relationship on model', async function (assert) {
    const jupiter = await store.addRecord({ type: 'planet', name: 'Jupiter' });
    const sun = await store.addRecord({ type: 'star', name: 'Sun' });

    assert.equal(jupiter.sun, null); // cache the relationship
    await store.source.update((t) =>
      t.replaceRelatedRecord(jupiter, 'sun', sun)
    );
    assert.equal(jupiter.sun, sun, 'invalidates the relationship');
  });

  test('update via store: replaceRelatedRecord operation invalidates a polymorphic relationship on model', async function (assert) {
    const solarSystem = await store.addRecord({
      type: 'planetarySystem',
      name: 'Home'
    });
    const sun = await store.addRecord({ type: 'star', name: 'Sun' });

    assert.equal(solarSystem.star, null); // cache the relationship
    await store.source.update((t) =>
      t.replaceRelatedRecord(solarSystem, 'star', sun)
    );
    assert.equal(solarSystem.star, sun, 'invalidates the relationship');
  });

  test('replace hasOne with null', async function (assert) {
    const jupiter = await store.addRecord({ type: 'planet', name: 'Jupiter' });
    const callisto = await store.addRecord({ type: 'moon', name: 'Callisto' });

    assert.equal(callisto.planet, null, 'hasOne is null');

    callisto.planet = jupiter;
    await waitForSource(store);

    assert.equal(callisto.planet, jupiter, 'hasOne is jupiter');

    callisto.planet = null;
    await waitForSource(store);

    assert.equal(callisto.planet, null, 'replaced hasOne with null');
    assert.ok(
      !jupiter.moons.includes(callisto),
      'removed from inverse hasMany'
    );
  });

  test('replace attribute on model', async function (assert) {
    const record = await store.addRecord({ type: 'planet', name: 'Jupiter' });
    record.name = 'Jupiter2';
    assert.equal(record.name, 'Jupiter2');
  });

  test('update via store: replaceAttribute operation invalidates attribute on model', async function (assert) {
    const record = await store.addRecord({ type: 'planet', name: 'Jupiter' });
    assert.equal(record.name, 'Jupiter'); // cache the name
    await store.update((t) => t.replaceAttribute(record, 'name', 'Jupiter2'));
    assert.equal(record.name, 'Jupiter2');
  });

  test('#getAttribute', async function (assert) {
    const record = await store.addRecord({ type: 'planet', name: 'Jupiter' });
    assert.equal(record.getAttribute('name'), 'Jupiter');
  });

  test('#replaceAttribute', async function (assert) {
    const record = await store.addRecord({ type: 'planet', name: 'Jupiter' });
    await record.replaceAttribute('name', 'Jupiter2');
    assert.equal(record.getAttribute('name'), 'Jupiter2');
  });

  test('#replaceAttributes', async function (assert) {
    const record = await store.addRecord({ type: 'planet', name: 'Jupiter' });
    await record.replaceAttributes({
      name: 'Jupiter2',
      classification: 'gas giant2'
    });

    assert.equal(record.name, 'Jupiter2');
    assert.equal(record.classification, 'gas giant2');
  });

  test('#replaceKey', async function (assert) {
    const record = await store.addRecord({
      type: 'planet',
      name: 'Jupiter',
      remoteId: 'planet:jupiter'
    });
    await record.replaceKey('remoteId', 'planet:joopiter');
    assert.equal(record.remoteId, 'planet:joopiter');
  });

  test('replace key via setter', async function (assert) {
    const record = await store.addRecord({
      type: 'planet',
      name: 'Jupiter',
      remoteId: 'planet:jupiter'
    });
    record.remoteId = 'planet:joopiter';
    await waitForSource(store);

    assert.equal(record.remoteId, 'planet:joopiter');
  });

  test('update via store: replaceKey operation invalidates key on model', async function (assert) {
    const record = await store.addRecord({
      type: 'planet',
      name: 'Jupiter',
      remoteId: 'planet:jupiter'
    });
    assert.equal(record.remoteId, 'planet:jupiter'); // cache the key
    await store.update((t) =>
      t.replaceKey(record, 'remoteId', 'planet:joopiter')
    );
    assert.equal(record.remoteId, 'planet:joopiter');
  });

  test('destroy model', async function (assert) {
    const cache = store.cache;

    const record = await store.addRecord({ type: 'planet', name: 'Jupiter' });
    const identifier = record.identity;
    record.destroy();

    await waitForSource(store);

    assert.ok(!cache._identityMap.has(identifier), 'removed from identity map');
  });

  test('#getData returns underlying record data', async function (assert) {
    const record = await store.addRecord({ type: 'planet', name: 'Jupiter' });
    let recordData = record.getData();
    assert.equal(
      recordData.attributes.name,
      'Jupiter',
      'returns record data (resource)'
    );
  });

  test('#getRelatedRecord / #replaceRelatedRecord', async function (assert) {
    const jupiter = await store.addRecord({ type: 'planet', name: 'Jupiter' });
    const sun = await store.addRecord({ type: 'star', name: 'Sun' });

    assert.strictEqual(jupiter.sun, undefined);
    assert.strictEqual(jupiter.getRelatedRecord('sun'), undefined);

    await jupiter.replaceRelatedRecord('sun', sun);

    assert.strictEqual(jupiter.sun, sun);
    assert.strictEqual(jupiter.getRelatedRecord('sun'), sun);

    await jupiter.replaceRelatedRecord('sun', null);
    assert.strictEqual(jupiter.sun, null);
    assert.strictEqual(jupiter.getRelatedRecord('sun'), null);
  });

  test('#addToRelatedRecords', async function (assert) {
    const jupiter = await store.addRecord({ type: 'planet', name: 'Jupiter' });
    const europa = await store.addRecord({ type: 'moon', name: 'Europa' });
    const io = await store.addRecord({ type: 'moon', name: 'Io' });

    assert.deepEqual(jupiter.getRelatedRecords('moons'), undefined);

    await jupiter.addToRelatedRecords('moons', europa);

    assert.deepEqual(jupiter.getRelatedRecords('moons'), [europa]);

    await jupiter.addToRelatedRecords('moons', io);

    assert.deepEqual(jupiter.getRelatedRecords('moons'), [europa, io]);
  });

  test('#addToRelatedRecords (polymorphic)', async function (assert) {
    const solarSystem = await store.addRecord({
      type: 'planetarySystem',
      name: 'Home'
    });
    const earth = await store.addRecord({ type: 'planet', name: 'Earth' });
    const luna = await store.addRecord({ type: 'moon', name: 'Luna' });

    assert.deepEqual(solarSystem.getRelatedRecords('bodies'), undefined);

    await solarSystem.addToRelatedRecords('bodies', earth);

    assert.deepEqual(solarSystem.getRelatedRecords('bodies'), [earth]);

    await solarSystem.addToRelatedRecords('bodies', luna);

    assert.deepEqual(solarSystem.getRelatedRecords('bodies'), [earth, luna]);
  });

  test('#removeFromRelatedRecords', async function (assert) {
    const europa = await store.addRecord({ type: 'moon', name: 'Europa' });
    const io = await store.addRecord({ type: 'moon', name: 'Io' });
    const jupiter = await store.addRecord({
      type: 'planet',
      name: 'Jupiter',
      moons: [europa, io]
    });

    assert.deepEqual(jupiter.getRelatedRecords('moons'), [europa, io]);

    await jupiter.removeFromRelatedRecords('moons', europa);

    assert.deepEqual(jupiter.getRelatedRecords('moons'), [io]);

    await jupiter.removeFromRelatedRecords('moons', io);

    assert.deepEqual(jupiter.getRelatedRecords('moons'), []);
  });

  test('#removeFromRelatedRecords (polymorphic)', async function (assert) {
    const earth = await store.addRecord({ type: 'planet', name: 'Earth' });
    const luna = await store.addRecord({ type: 'moon', name: 'Luna' });
    const solarSystem = await store.addRecord({
      type: 'planetarySystem',
      name: 'Home',
      bodies: [earth, luna]
    });

    assert.deepEqual(solarSystem.getRelatedRecords('bodies'), [earth, luna]);

    await solarSystem.removeFromRelatedRecords('bodies', earth);

    assert.deepEqual(solarSystem.getRelatedRecords('bodies'), [luna]);

    await solarSystem.removeFromRelatedRecords('bodies', luna);

    assert.deepEqual(solarSystem.getRelatedRecords('bodies'), []);
  });

  test('#update - updates attribute and relationships (with records)', async function (assert) {
    const jupiter = await store.addRecord({ type: 'planet', name: 'Jupiter' });
    const sun = await store.addRecord({ type: 'star', name: 'Sun' });
    const callisto = await store.addRecord({ type: 'moon', name: 'Callisto' });

    assert.equal(jupiter.name, 'Jupiter');
    assert.equal(jupiter.sun, null);
    assert.deepEqual(jupiter.moons, []);

    await jupiter.update({
      name: 'Jupiter2',
      sun,
      moons: [callisto]
    });

    assert.equal(jupiter.name, 'Jupiter2');
    assert.equal(jupiter.sun, sun, 'invalidates has one relationship');
    assert.deepEqual(
      jupiter.moons,
      [callisto],
      'invalidates has many relationship'
    );
  });

  test('#update - updates relationships (with IDs)', async function (assert) {
    const jupiter = await store.addRecord({ type: 'planet', name: 'Jupiter' });
    const sun = await store.addRecord({ type: 'star', name: 'Sun' });
    const callisto = await store.addRecord({ type: 'moon', name: 'Callisto' });

    assert.equal(jupiter.sun, null);
    assert.deepEqual(jupiter.moons, []);

    await jupiter.update({
      sun: sun.id,
      moons: [callisto.id]
    });

    assert.equal(jupiter.sun, sun, 'invalidates has one relationship');
    assert.deepEqual(
      jupiter.moons,
      [callisto],
      'invalidates has many relationship'
    );
  });

  test('#base store', async function (assert) {
    const jupiter = await store.base.addRecord({
      type: 'planet',
      name: 'Jupiter'
    });

    assert.throws(() => {
      jupiter.name = 'Jupiter2';
    }, /is part of a readonly store/);
  });
});
