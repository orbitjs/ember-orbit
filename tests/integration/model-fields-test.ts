import { setupTest } from 'ember-qunit';
import { module, test } from 'qunit';
import type ApplicationInstance from '@ember/application/instance';
import { normalizeModelFields } from '#src/-private/utils/model-fields.ts';
import { Store } from '#src/index.ts';
import {
  BinaryStar,
  Moon,
  Planet,
  PlanetarySystem,
  Star,
} from '../support/dummy-models';
import { createStore } from '../support/store';

module('Integration - normalizeModelFields', function (hooks) {
  setupTest(hooks);

  let store: Store;

  hooks.beforeEach(function () {
    store = createStore(this.owner as ApplicationInstance, {
      planet: Planet,
      moon: Moon,
      star: Star,
      binaryStar: BinaryStar,
      planetarySystem: PlanetarySystem,
    });
  });

  test('#normalizeModelFields', async function (assert) {
    const callisto = await store.addRecord({
      type: 'moon',
      id: 'callisto',
      name: 'Callisto',
    });
    const sun = await store.addRecord({
      type: 'star',
      id: 'sun',
      name: 'The Sun',
    });
    const normalized = normalizeModelFields(store.source.schema, {
      type: 'planet',
      id: 'jupiter',
      name: 'Jupiter',
      moons: [callisto],
      sun: sun,
    });

    assert.strictEqual(normalized.id, 'jupiter', 'normalized id');
    assert.strictEqual(normalized.type, 'planet', 'normalized type');
    assert.deepEqual(normalized.keys, undefined, 'normalized keys');
    assert.deepEqual(normalized.attributes, { name: 'Jupiter' });
    assert.deepEqual(
      normalized.relationships?.['moons'],
      { data: [{ type: 'moon', id: 'callisto' }] },
      'normalized hasMany',
    );
    assert.deepEqual(
      normalized.relationships?.['sun'],
      { data: { type: 'star', id: 'sun' } },
      'normalized hasOne',
    );
  });

  test('#normalizeModelFields - undefined relationships', function (assert) {
    const normalized = normalizeModelFields(store.source.schema, {
      type: 'planet',
      id: 'jupiter',
      name: 'Jupiter',
    });

    assert.strictEqual(
      normalized.relationships,
      undefined,
      'normalized hasMany',
    );
  });

  test('#normalizeModelFields - nullable relationships', function (assert) {
    const normalized = normalizeModelFields(store.source.schema, {
      type: 'planet',
      id: 'jupiter',
      name: 'Jupiter',
      sun: null,
    });

    assert.deepEqual(
      normalized.relationships?.['sun'],
      { data: null },
      'normalized nullable hasOne',
    );
  });

  test('#normalizeModelFields - polymorphic relationships', async function (assert) {
    const luna = await store.addRecord({
      type: 'moon',
      id: 'luna',
      name: 'Luna',
    });
    const earth = await store.addRecord({
      type: 'planet',
      id: 'earth',
      name: 'Earth',
    });
    const sun = await store.addRecord({
      type: 'star',
      id: 'sun',
      name: 'The Sun',
    });

    const expectedName = 'Our Solar System';
    const normalized = normalizeModelFields(store.source.schema, {
      type: 'planetarySystem',
      id: 'homeSystem',
      name: expectedName,
      star: sun,
      bodies: [luna, earth],
    });

    assert.strictEqual(normalized.id, 'homeSystem', 'normalized id');
    assert.strictEqual(normalized.type, 'planetarySystem', 'normalized type');
    assert.deepEqual(normalized.keys, undefined, 'normalized keys');
    assert.deepEqual(normalized.attributes, { name: expectedName });
    assert.deepEqual(
      normalized.relationships?.['star'],
      { data: { type: 'star', id: 'sun' } },
      'normalized hasOne',
    );
    assert.deepEqual(
      normalized.relationships?.['bodies'],
      {
        data: [
          { type: 'moon', id: 'luna' },
          { type: 'planet', id: 'earth' },
        ],
      },
      'normalized hasMany',
    );
  });

  test('#normalizeModelFields - polymorphic relationships require RecordIdentity values', async function (assert) {
    const luna = await store.addRecord({
      type: 'moon',
      id: 'luna',
      name: 'Luna',
    });
    const earth = await store.addRecord({
      type: 'planet',
      id: 'earth',
      name: 'Earth',
    });
    const sun = await store.addRecord({
      type: 'star',
      id: 'sun',
      name: 'The Sun',
    });

    assert.throws(
      () =>
        normalizeModelFields(store.source.schema, {
          type: 'planetarySystem',
          id: 'homeSystem',
          star: sun.id,
        }),
      'polymorphic hasOne requires RecordIdentity',
    );

    assert.throws(
      () =>
        normalizeModelFields(store.source.schema, {
          type: 'planetarySystem',
          id: 'homeSystem',
          bodies: [luna.id, earth.id],
        }),
      'polymorphic haMany requires RecordIdentity[]',
    );
  });
});
