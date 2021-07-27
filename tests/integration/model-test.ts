/* eslint-disable ember/no-classic-classes */
import { Store, Cache } from 'ember-orbit';
import EmberObject from '@ember/object';
import {
  Planet,
  Moon,
  Star,
  Ocean,
  BinaryStar,
  PlanetarySystem
} from 'dummy/tests/support/dummy-models';
import { createStore } from 'dummy/tests/support/store';
import { module, test } from 'qunit';
import { getOwner } from '@ember/application';
import { setupTest } from 'ember-qunit';
import { Assertion } from '@orbit/core';
import { settled } from '@ember/test-helpers';

module('Integration - Model', function (hooks) {
  setupTest(hooks);

  let store: Store;
  let cache: Cache;

  hooks.beforeEach(function () {
    const models = {
      planet: Planet,
      moon: Moon,
      star: Star,
      ocean: Ocean,
      binaryStar: BinaryStar,
      planetarySystem: PlanetarySystem
    };
    store = createStore(this.owner, models).fork();
    cache = store.cache;
  });

  test('models are assigned the same owner as the store and cache', async function (assert) {
    const model = await store.addRecord({ type: 'star', name: 'The Sun' });
    assert.ok(getOwner(model), 'model has an owner');
    assert.strictEqual(
      getOwner(model),
      getOwner(store),
      'model has same owner as store'
    );
    assert.strictEqual(
      getOwner(model),
      getOwner(cache),
      'model has same owner as cache'
    );
  });

  test('models can receive registered injections', async function (assert) {
    const Foo = EmberObject.extend({
      bar: 'bar'
    });

    const app = getOwner(store);
    app.register('service:foo', Foo);
    app.inject('data-model:star', 'foo', 'service:foo');

    // Add record to store
    const model = await store.addRecord<Star>({
      type: 'star',
      name: 'The Sun'
    });
    assert.ok((model as any).foo, 'service has been injected');
    assert.equal((model as any).foo.bar, 'bar', 'service is correct');

    // Add record to cache
    const model2 = store.cache.addRecord<Star>({
      type: 'star',
      name: 'The Sun'
    });
    assert.ok((model2 as any).foo, 'service has been injected');
    assert.equal((model2 as any).foo.bar, 'bar', 'service is correct');
  });

  test('models can be added to the store', async function (assert) {
    const theSun = await store.addRecord<Star>({
      type: 'star',
      name: 'The Sun'
    });
    const callisto = await store.addRecord<Moon>({
      type: 'moon',
      name: 'Callisto'
    });
    const record = await store.addRecord<Planet>({
      type: 'planet',
      remoteId: 'planet:jupiter',
      name: 'Jupiter',
      sun: theSun,
      moons: [callisto]
    });

    assert.ok(record.id, 'assigned id');
    assert.deepEqual(
      record.$identity,
      { id: record.id, type: 'planet' },
      'assigned identity that includes type and id'
    );
    assert.equal(record.name, 'Jupiter', 'assigned specified attribute');
    assert.equal(record.remoteId, 'planet:jupiter', 'assigned secondary key');
    assert.strictEqual(record.sun, theSun, 'assigned hasOne');
    assert.strictEqual(record.moons[0], callisto, 'assigned hasMany');
  });

  test('models can be added to a forked cache', function (assert) {
    const theSun = cache.addRecord<Star>({
      type: 'star',
      name: 'The Sun'
    });
    const callisto = cache.addRecord<Moon>({
      type: 'moon',
      name: 'Callisto'
    });
    const record = cache.addRecord<Planet>({
      type: 'planet',
      remoteId: 'planet:jupiter',
      name: 'Jupiter',
      sun: theSun,
      moons: [callisto]
    });

    assert.ok(record.id, 'assigned id');
    assert.deepEqual(
      record.$identity,
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
    const record = await store.addRecord<Star>({
      type: 'star',
      name: 'The Sun'
    });

    record.$remove();

    assert.notOk(
      cache.includesRecord('star', record.id),
      'record does not exist in cache'
    );
    assert.ok(
      record.$isDisconnected,
      'record has been disconnected from cache'
    );
    assert.throws(
      () => record.name,
      Error,
      'record has been removed from cache'
    );
  });

  test('remove model with relationships', async function (assert) {
    const callisto = await store.addRecord<Moon>({
      type: 'moon',
      name: 'Callisto'
    });
    const sun = await store.addRecord<Star>({ type: 'star', name: 'Sun' });
    const jupiter = await store.addRecord<Planet>({
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

    jupiter.$remove();
  });

  test('add to hasMany', async function (assert) {
    const jupiter = await store.addRecord<Planet>({
      type: 'planet',
      name: 'Jupiter'
    });
    const callisto = await store.addRecord<Moon>({
      type: 'moon',
      name: 'Callisto'
    });

    jupiter.$addToRelatedRecords('moons', callisto);

    assert.ok(jupiter.moons.includes(callisto), 'added record to hasMany');
    assert.equal(callisto.planet, jupiter, 'updated inverse');
  });

  test('add to polymorphic hasMany', async function (assert) {
    const solarSystem = await store.addRecord<PlanetarySystem>({
      type: 'planetarySystem',
      name: 'Home'
    });
    const callisto = await store.addRecord<Moon>({
      type: 'moon',
      name: 'Callisto'
    });

    solarSystem.$addToRelatedRecords('bodies', callisto);

    assert.ok(
      solarSystem.bodies.includes(callisto),
      'added record to polymorphic hasMany'
    );
  });

  test('remove from hasMany', async function (assert) {
    const jupiter = await store.addRecord<Planet>({
      type: 'planet',
      name: 'Jupiter'
    });
    const callisto = await store.addRecord<Moon>({
      type: 'moon',
      name: 'Callisto'
    });

    jupiter.$addToRelatedRecords('moons', callisto);
    jupiter.$removeFromRelatedRecords('moons', callisto);

    assert.ok(!jupiter.moons.includes(callisto), 'removed record from hasMany');
    assert.ok(!callisto.planet, 'updated inverse');
  });

  test('remove from polymorphic hasMany', async function (assert) {
    const solarSystem = await store.addRecord<PlanetarySystem>({
      type: 'planetarySystem',
      name: 'Home'
    });
    const callisto = await store.addRecord<Moon>({
      type: 'moon',
      name: 'Callisto'
    });

    solarSystem.$addToRelatedRecords('bodies', callisto);
    solarSystem.$removeFromRelatedRecords('bodies', callisto);

    assert.ok(
      !solarSystem.bodies.includes(callisto),
      'removed record to polymorphic hasMany'
    );
  });

  test('update via source: replaceRelatedRecords operation invalidates a relationship on model', async function (assert) {
    const jupiter = await store.addRecord<Planet>({
      type: 'planet',
      name: 'Jupiter'
    });
    const callisto = await store.addRecord<Moon>({
      type: 'moon',
      name: 'Callisto'
    });
    assert.deepEqual(jupiter.moons, []); // cache the relationship
    await store.source.update((t) =>
      t.replaceRelatedRecords(jupiter.$identity, 'moons', [callisto.$identity])
    );
    assert.deepEqual(jupiter.moons, [callisto], 'invalidates the relationship');
  });

  test('update via source: replaceRelatedRecords operation invalidates a polymorphic relationship on model', async function (assert) {
    const solarSystem = await store.addRecord<PlanetarySystem>({
      type: 'planetarySystem',
      name: 'Home'
    });
    const callisto = await store.addRecord({ type: 'moon', name: 'Callisto' });

    assert.deepEqual(solarSystem.bodies, []); // cache the relationship
    await store.source.update((t) =>
      t.replaceRelatedRecords(solarSystem.$identity, 'bodies', [
        callisto.$identity
      ])
    );
    assert.deepEqual(
      solarSystem.bodies,
      [callisto],
      'invalidates the relationship'
    );
  });

  test('replace hasOne with record', async function (assert) {
    const [jupiter, callisto] = await store.update<[Planet, Moon]>((t) => [
      t.addRecord({ type: 'planet', name: 'Jupiter' }),
      t.addRecord({ type: 'moon', name: 'Callisto' })
    ]);

    callisto.planet = jupiter;

    assert.equal(callisto.planet, jupiter, 'replaced hasOne with record');
    assert.ok(jupiter.moons.includes(callisto), 'updated inverse');
  });

  test('replace polymorphic hasOne with record', function (assert) {
    const solarSystem = cache.addRecord<PlanetarySystem>({
      type: 'planetarySystem',
      name: 'Home'
    });
    const sun = cache.addRecord<Star>({ type: 'star', name: 'Sun' });
    const twinSun = cache.addRecord<Star>({
      type: 'binaryStar',
      name: 'Twin Sun'
    });

    solarSystem.star = twinSun;

    assert.equal(
      solarSystem.star,
      twinSun,
      'replaced polymorphic hasOne with record'
    );

    solarSystem.star = sun;

    assert.equal(
      solarSystem.star,
      sun,
      'replaced polymorphic hasOne with record of another valid type'
    );
  });

  test('update via store: replaceRelatedRecord operation invalidates a relationship on model', async function (assert) {
    const jupiter = await store.addRecord<Planet>({
      type: 'planet',
      name: 'Jupiter'
    });
    const sun = await store.addRecord<Star>({ type: 'star', name: 'Sun' });

    assert.equal(jupiter.sun, null); // cache the relationship
    await store.source.update((t) =>
      t.replaceRelatedRecord(jupiter.$identity, 'sun', sun.$identity)
    );
    assert.equal(jupiter.sun, sun, 'invalidates the relationship');
  });

  test('update via store: replaceRelatedRecord operation invalidates a polymorphic relationship on model', async function (assert) {
    const solarSystem = await store.addRecord<PlanetarySystem>({
      type: 'planetarySystem',
      name: 'Home'
    });
    const sun = await store.addRecord<Star>({ type: 'star', name: 'Sun' });

    assert.equal(solarSystem.star, null); // cache the relationship
    await store.source.update((t) =>
      t.replaceRelatedRecord(solarSystem.$identity, 'star', sun.$identity)
    );
    assert.equal(solarSystem.star, sun, 'invalidates the relationship');
  });

  test('replace hasOne with null', function (assert) {
    const jupiter = cache.addRecord<Planet>({
      type: 'planet',
      name: 'Jupiter'
    });
    const callisto = cache.addRecord<Moon>({
      type: 'moon',
      name: 'Callisto'
    });

    assert.equal(callisto.planet, null, 'hasOne is null');

    callisto.planet = jupiter;

    assert.equal(callisto.planet, jupiter, 'hasOne is jupiter');

    callisto.planet = null;

    assert.equal(callisto.planet, null, 'replaced hasOne with null');
    assert.ok(
      !jupiter.moons.includes(callisto),
      'removed from inverse hasMany'
    );
  });

  test('replace attribute on model', function (assert) {
    const record = cache.addRecord<Planet>({
      type: 'planet',
      name: 'Jupiter'
    });
    record.name = 'Jupiter2';
    assert.equal(record.name, 'Jupiter2');
  });

  test('update via store: replaceAttribute operation invalidates attribute on model', async function (assert) {
    const record = await store.addRecord<Planet>({
      type: 'planet',
      name: 'Jupiter'
    });
    assert.equal(record.name, 'Jupiter'); // cache the name
    await store.update((t) =>
      t.replaceAttribute(record.$identity, 'name', 'Jupiter2')
    );
    assert.equal(record.name, 'Jupiter2');
  });

  test('$getAttribute', function (assert) {
    const record = cache.addRecord({ type: 'planet', name: 'Jupiter' });
    assert.equal(record.$getAttribute('name'), 'Jupiter');
  });

  test('$replaceAttribute', function (assert) {
    const record = cache.addRecord({ type: 'planet', name: 'Jupiter' });
    record.$replaceAttribute('name', 'Jupiter2');
    assert.equal(record.$getAttribute('name'), 'Jupiter2');
  });

  test('$replaceKey', function (assert) {
    const record = cache.addRecord<Planet>({
      type: 'planet',
      name: 'Jupiter',
      remoteId: 'planet:jupiter'
    });
    record.$replaceKey('remoteId', 'planet:joopiter');
    assert.equal(record.remoteId, 'planet:joopiter');
  });

  test('replace key via setter', function (assert) {
    const record = cache.addRecord<Planet>({
      type: 'planet',
      name: 'Jupiter',
      remoteId: 'planet:jupiter'
    });
    record.remoteId = 'planet:joopiter';

    assert.equal(record.remoteId, 'planet:joopiter');
  });

  test('update via store: replaceKey operation invalidates key on model', async function (assert) {
    const record = await store.addRecord<Planet>({
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

  test('$destroy frees model', async function (assert) {
    const cache = store.cache;

    const record = await store.addRecord({ type: 'planet', name: 'Jupiter' });
    const identifier = record.$identity;
    record.$destroy();

    await settled();

    assert.ok(
      !(cache as any)._identityMap.has(identifier),
      'removed from identity map'
    );
  });

  test('$getData returns underlying record data', function (assert) {
    const record = cache.addRecord<Planet>({
      type: 'planet',
      name: 'Jupiter'
    });
    let recordData = record.$getData();
    assert.equal(
      recordData?.attributes?.name,
      'Jupiter',
      'returns record data (resource)'
    );
  });

  test('$getData returns undefined if record is not present in cache', function (assert) {
    const record = store.cache.lookup({
      type: 'planet',
      id: 'jupiter'
    });
    let recordData = record.$getData();
    assert.strictEqual(recordData, undefined, 'returns undefined');
  });

  test('$getData fails when record has been removed from its cache', function (assert) {
    const record = cache.addRecord<Planet>({
      type: 'planet',
      name: 'Jupiter'
    });
    record.$remove();
    assert.throws(
      () => record.$getData(),
      Assertion,
      'Error: Assertion failed: Model must be connected to a store in order to call `$getData`'
    );
  });

  test('$getRelatedRecord / $replaceRelatedRecord', function (assert) {
    const jupiter = cache.addRecord<Planet>({
      type: 'planet',
      name: 'Jupiter'
    });
    const sun = cache.addRecord<Star>({ type: 'star', name: 'Sun' });

    assert.strictEqual(jupiter.sun, undefined);
    assert.strictEqual(jupiter.$getRelatedRecord('sun'), undefined);

    jupiter.$replaceRelatedRecord('sun', sun);

    assert.strictEqual(jupiter.sun, sun);
    assert.strictEqual(jupiter.$getRelatedRecord('sun'), sun);

    jupiter.$replaceRelatedRecord('sun', null);
    assert.strictEqual(jupiter.sun, null);
    assert.strictEqual(jupiter.$getRelatedRecord('sun'), null);
  });

  test('$addToRelatedRecords', function (assert) {
    const jupiter = cache.addRecord({ type: 'planet', name: 'Jupiter' });
    const europa = cache.addRecord({ type: 'moon', name: 'Europa' });
    const io = cache.addRecord({ type: 'moon', name: 'Io' });

    assert.deepEqual(jupiter.$getRelatedRecords('moons'), undefined);

    jupiter.$addToRelatedRecords('moons', europa);

    assert.deepEqual(jupiter.$getRelatedRecords('moons'), [europa]);

    jupiter.$addToRelatedRecords('moons', io);

    assert.deepEqual(jupiter.$getRelatedRecords('moons'), [europa, io]);
  });

  test('$addToRelatedRecords (polymorphic)', function (assert) {
    const solarSystem = cache.addRecord({
      type: 'planetarySystem',
      name: 'Home'
    });
    const earth = cache.addRecord({ type: 'planet', name: 'Earth' });
    const luna = cache.addRecord({ type: 'moon', name: 'Luna' });

    assert.deepEqual(solarSystem.$getRelatedRecords('bodies'), undefined);

    solarSystem.$addToRelatedRecords('bodies', earth);

    assert.deepEqual(solarSystem.$getRelatedRecords('bodies'), [earth]);

    solarSystem.$addToRelatedRecords('bodies', luna);

    assert.deepEqual(solarSystem.$getRelatedRecords('bodies'), [earth, luna]);
  });

  test('$removeFromRelatedRecords', function (assert) {
    const europa = cache.addRecord({ type: 'moon', name: 'Europa' });
    const io = cache.addRecord({ type: 'moon', name: 'Io' });
    const jupiter = cache.addRecord({
      type: 'planet',
      name: 'Jupiter',
      moons: [europa, io]
    });

    assert.deepEqual(jupiter.$getRelatedRecords('moons'), [europa, io]);

    jupiter.$removeFromRelatedRecords('moons', europa);

    assert.deepEqual(jupiter.$getRelatedRecords('moons'), [io]);

    jupiter.$removeFromRelatedRecords('moons', io);

    assert.deepEqual(jupiter.$getRelatedRecords('moons'), []);
  });

  test('$removeFromRelatedRecords (polymorphic)', function (assert) {
    const earth = cache.addRecord<Planet>({
      type: 'planet',
      name: 'Earth'
    });
    const luna = cache.addRecord<Moon>({ type: 'moon', name: 'Luna' });
    const solarSystem = cache.addRecord<PlanetarySystem>({
      type: 'planetarySystem',
      name: 'Home',
      bodies: [earth, luna]
    });

    assert.deepEqual(solarSystem.$getRelatedRecords('bodies'), [earth, luna]);

    solarSystem.$removeFromRelatedRecords('bodies', earth);

    assert.deepEqual(solarSystem.$getRelatedRecords('bodies'), [luna]);

    solarSystem.$removeFromRelatedRecords('bodies', luna);

    assert.deepEqual(solarSystem.$getRelatedRecords('bodies'), []);
  });

  test('$update - updates multiple attributes', function (assert) {
    const record = cache.addRecord<Planet>({
      type: 'planet',
      name: 'Jupiter'
    });

    record.$update({
      name: 'Jupiter2',
      classification: 'gas giant2'
    });

    assert.equal(record.name, 'Jupiter2');
    assert.equal(record.classification, 'gas giant2');
  });

  test('$update - updates attribute and relationships (with records)', function (assert) {
    const jupiter = cache.addRecord<Planet>({
      type: 'planet',
      name: 'Jupiter'
    });
    const sun = cache.addRecord<Star>({ type: 'star', name: 'Sun' });
    const callisto = cache.addRecord<Moon>({
      type: 'moon',
      name: 'Callisto'
    });

    assert.equal(jupiter.name, 'Jupiter');
    assert.equal(jupiter.sun, null);
    assert.deepEqual(jupiter.moons, []);

    jupiter.$update({
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

  test('$update - updates relationships (with IDs)', function (assert) {
    const jupiter = cache.addRecord<Planet>({
      type: 'planet',
      name: 'Jupiter'
    });
    const sun = cache.addRecord<Star>({ type: 'star', name: 'Sun' });
    const callisto = cache.addRecord<Moon>({
      type: 'moon',
      name: 'Callisto'
    });

    assert.equal(jupiter.sun, null);
    assert.deepEqual(jupiter.moons, []);

    jupiter.$update({
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

  test('unforked (base) cache prevents updates by default', async function (assert) {
    const base = store.base!;

    const jupiter = await base.addRecord<Planet>({
      type: 'planet',
      name: 'Jupiter'
    });

    assert.throws(() => {
      jupiter.name = 'Jupiter2';
    }, /You tried to update a cache that is not a fork/);

    base.cache.allowUpdates = true;
    jupiter.name = 'Jupiter3';
    assert.equal(
      jupiter.name,
      'Jupiter3',
      'cache.allowUpdates can be overridden'
    );
  });

  test('triggers updates to properties defined by ember computed macros', function (assert) {
    const jupiter = cache.addRecord<Planet>({ type: 'planet' });

    assert.equal(jupiter.name, undefined);
    assert.equal(jupiter.hasName, false);

    jupiter.$update({
      name: 'Jupiter'
    });

    assert.equal(jupiter.name, 'Jupiter');
    assert.equal(jupiter.hasName, true);
  });
});
