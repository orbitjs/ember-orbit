import {
  Planet,
  Moon,
  Star,
  BinaryStar,
  PlanetarySystem
} from 'dummy/tests/support/dummy-models';
import { createStore } from 'dummy/tests/support/store';
import { module, test } from 'qunit';

import normalizeRecordProperties from 'ember-orbit/-private/utils/normalize-record-properties';

module('Integration - normalizeRecordProperties', function (hooks) {
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

  test('#normalizeRecordProperties', async function (assert) {
    const callisto = await store.addRecord({
      type: 'moon',
      id: 'callisto',
      name: 'Callisto'
    });
    const sun = await store.addRecord({
      type: 'star',
      id: 'sun',
      name: 'The Sun'
    });
    const normalized = normalizeRecordProperties(store.source.schema, {
      type: 'planet',
      id: 'jupiter',
      name: 'Jupiter',
      moons: [callisto],
      sun: sun
    });

    assert.equal(normalized.id, 'jupiter', 'normalized id');
    assert.equal(normalized.type, 'planet', 'normalized type');
    assert.deepEqual(normalized.keys, undefined, 'normalized keys');
    assert.deepEqual(normalized.attributes, { name: 'Jupiter' });
    assert.deepEqual(
      normalized.relationships.moons,
      { data: [{ type: 'moon', id: 'callisto' }] },
      'normalized hasMany'
    );
    assert.deepEqual(
      normalized.relationships.sun,
      { data: { type: 'star', id: 'sun' } },
      'normalized hasOne'
    );
  });

  test('#normalizeRecordProperties - undefined relationships', function (assert) {
    const normalized = normalizeRecordProperties(store.source.schema, {
      type: 'planet',
      id: 'jupiter',
      name: 'Jupiter'
    });

    assert.strictEqual(
      normalized.relationships,
      undefined,
      'normalized hasMany'
    );
  });

  test('#normalizeRecordProperties - nullable relationships', function (assert) {
    const normalized = normalizeRecordProperties(store.source.schema, {
      type: 'planet',
      id: 'jupiter',
      name: 'Jupiter',
      sun: null
    });

    assert.deepEqual(
      normalized.relationships.sun,
      { data: null },
      'normalized nullable hasOne'
    );
  });

  test('#normalizeRecordProperties - polymorphic relationships', async function (assert) {
    const luna = await store.addRecord({
      type: 'moon',
      id: 'luna',
      name: 'Luna'
    });
    const earth = await store.addRecord({
      type: 'planet',
      id: 'earth',
      name: 'Earth'
    });
    const sun = await store.addRecord({
      type: 'star',
      id: 'sun',
      name: 'The Sun'
    });

    const expectedName = 'Our Solar System';
    const normalized = normalizeRecordProperties(store.source.schema, {
      type: 'planetarySystem',
      id: 'homeSystem',
      name: expectedName,
      star: sun,
      bodies: [luna, earth]
    });

    assert.equal(normalized.id, 'homeSystem', 'normalized id');
    assert.equal(normalized.type, 'planetarySystem', 'normalized type');
    assert.deepEqual(normalized.keys, undefined, 'normalized keys');
    assert.deepEqual(normalized.attributes, { name: expectedName });
    assert.deepEqual(
      normalized.relationships.star,
      { data: { type: 'star', id: 'sun' } },
      'normalized hasOne'
    );
    assert.deepEqual(
      normalized.relationships.bodies,
      {
        data: [
          { type: 'moon', id: 'luna' },
          { type: 'planet', id: 'earth' }
        ]
      },
      'normalized hasMany'
    );
  });

  test('#normalizeRecordProperties - polymorphic relationships require RecordIdentity values', async function (assert) {
    const luna = await store.addRecord({
      type: 'moon',
      id: 'luna',
      name: 'Luna'
    });
    const earth = await store.addRecord({
      type: 'planet',
      id: 'earth',
      name: 'Earth'
    });
    const sun = await store.addRecord({
      type: 'star',
      id: 'sun',
      name: 'The Sun'
    });

    assert.throws(
      () =>
        normalizeRecordProperties(store.source.schema, {
          type: 'planetarySystem',
          id: 'homeSystem',
          star: sun.id
        }),
      'polymorphic hasOne requires RecordIdentity'
    );

    assert.throws(
      () =>
        normalizeRecordProperties(store.source.schema, {
          type: 'planetarySystem',
          id: 'homeSystem',
          bodies: [luna.id, earth.id]
        }),
      'polymorphic haMany requires RecordIdentity[]'
    );
  });
});
