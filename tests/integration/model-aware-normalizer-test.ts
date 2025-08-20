import { Store } from 'ember-orbit';
import {
  Planet,
  Moon,
  Star,
  BinaryStar,
  PlanetarySystem
} from 'dummy/tests/support/dummy-models';
import { createStore } from 'dummy/tests/support/store';
import { module, test } from 'qunit';

import { setupTest } from 'ember-qunit';
import {
  isStandardRecord,
  ModelAwareNormalizer
} from 'ember-orbit/-private/utils/model-aware-normalizer';

module('Integration - ModelAwareNormalizer', function (hooks) {
  setupTest(hooks);

  let store: Store;
  let normalizer: ModelAwareNormalizer;

  hooks.beforeEach(function () {
    store = createStore(this.owner, {
      planet: Planet,
      moon: Moon,
      star: Star,
      binaryStar: BinaryStar,
      planetarySystem: PlanetarySystem
    });
    normalizer = store.transformBuilder.$normalizer as ModelAwareNormalizer;
  });

  test('isStandardRecord function checks whether a record is already in standard normalized form', function (assert) {
    assert.ok(
      isStandardRecord({
        type: 'planet',
        id: 'jupiter',
        attributes: {
          name: 'Jupiter'
        }
      })
    );
    assert.ok(
      isStandardRecord({
        type: 'planet',
        id: 'jupiter',
        keys: {
          remoteId: '123'
        }
      })
    );
    assert.ok(
      isStandardRecord({
        type: 'planet',
        id: 'jupiter',
        relationships: {
          sun: {
            data: null
          }
        }
      })
    );
    assert.notOk(
      isStandardRecord({
        type: 'planet',
        id: 'jupiter',
        name: 'Jupiter',
        sun: null
      })
    );
  });

  test('#normalizeRecord', async function (assert) {
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

    const normalized = normalizer.normalizeRecord({
      type: 'planet',
      id: 'jupiter',
      name: 'Jupiter',
      moons: [callisto],
      sun: sun
    });

    assert.strictEqual(normalized.id, 'jupiter', 'normalized id');
    assert.strictEqual(normalized.type, 'planet', 'normalized type');
    assert.deepEqual(normalized.keys, undefined, 'normalized keys');
    assert.deepEqual(normalized.attributes, { name: 'Jupiter' });
    assert.deepEqual(
      normalized.relationships?.['moons'],
      { data: [{ type: 'moon', id: 'callisto' }] },
      'normalized hasMany'
    );
    assert.deepEqual(
      normalized.relationships?.['sun'],
      { data: { type: 'star', id: 'sun' } },
      'normalized hasOne'
    );
  });

  test('#normalizeRecord - polymorphic relationships', async function (assert) {
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
    const normalized = normalizer.normalizeRecord({
      type: 'planetarySystem',
      id: 'homeSystem',
      name: expectedName,
      star: sun,
      bodies: [luna, earth]
    });

    assert.strictEqual(normalized.id, 'homeSystem', 'normalized id');
    assert.strictEqual(normalized.type, 'planetarySystem', 'normalized type');
    assert.deepEqual(normalized.keys, undefined, 'normalized keys');
    assert.deepEqual(normalized.attributes, { name: expectedName });
    assert.deepEqual(
      normalized.relationships?.['star'],
      { data: { type: 'star', id: 'sun' } },
      'normalized hasOne'
    );
    assert.deepEqual(
      normalized.relationships?.['bodies'],
      {
        data: [
          { type: 'moon', id: 'luna' },
          { type: 'planet', id: 'earth' }
        ]
      },
      'normalized hasMany'
    );
  });

  test('#normalizeRecord - pre-normalized attributes + undefined relationships', function (assert) {
    const normalized = normalizer.normalizeRecord({
      type: 'planet',
      id: 'jupiter',
      attributes: {
        name: 'Jupiter'
      }
    });

    assert.deepEqual(normalized.attributes?.['name'], 'Jupiter');
  });

  test('#normalizeRecord - pre-normalized relationship + undefined attributes', function (assert) {
    const normalized = normalizer.normalizeRecord({
      type: 'planet',
      id: 'jupiter',
      relationships: {
        sun: {
          data: null
        }
      }
    });

    assert.deepEqual(normalized.relationships?.['sun'], { data: null });
  });
});
