import { Store } from 'ember-orbit';
import { Planet, Moon, Star } from 'dummy/tests/support/dummy-models';
import { createStore } from 'dummy/tests/support/store';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import type { RecordKeyMap, RecordNormalizer, RecordSchema, StandardRecordNormalizer } from '@orbit/records';

module('Integration - Config', function (hooks) {
  setupTest(hooks);

  let store: Store;

  hooks.beforeEach(function () {
    this.owner.register(
      'config:environment',
      {
        orbit: {
          schemaVersion: 2,
          types: {
            bucket: 'orbit-bucket',
            model: 'orbit-model',
            source: 'orbit-source',
            strategy: 'orbit-strategy'
          },
          collections: {
            buckets: 'orbit-buckets',
            models: 'orbit-models',
            sources: 'orbit-sources',
            strategies: 'orbit-strategies'
          },
          services: {
            store: 'orbit-store',
            coordinator: 'orbit-coordinator',
            schema: 'data-schema',
            keyMap: 'orbit-key-map',
            normalizer: 'orbit-normalizer',
            validator: 'orbit-validator'
          }
        }
      },
      { instantiate: false }
    );
    const models = { planet: Planet, moon: Moon, star: Star };
    store = createStore(this.owner, models);
  });

  test('registrations respect config', async function (assert) {
    const schema = this.owner.lookup('service:data-schema') as RecordSchema;
    const keyMap = this.owner.lookup('service:orbit-key-map') as RecordKeyMap;
    const normalizer = this.owner.lookup('service:orbit-normalizer') as StandardRecordNormalizer;
    const validatorFor = this.owner.lookup('service:orbit-validator');

    assert.strictEqual(
      schema.version,
      2,
      'schema version matches configuration'
    );
    assert.strictEqual(
      this.owner.lookup('service:orbit-store'),
      store,
      'store service registration is named from configuration'
    );
    assert.ok(
      // @ts-expect-error TODO: fix this type error
      this.owner.resolveRegistration('orbit-model:planet'),
      'model factory registration is named from configuration'
    );
    assert.strictEqual(
      this.owner.lookup('orbit-source:store'),
      store.source,
      'source registation is named from configuration'
    );
    assert.strictEqual(
      (this.owner.lookup('orbit-source:store') as Store).schema,
      schema,
      'schema is injected into sources'
    );
    assert.strictEqual(
      (this.owner.lookup('orbit-source:store') as Store).keyMap,
      keyMap,
      'keyMap is injected into sources'
    );
    assert.strictEqual(
      (this.owner.lookup('orbit-source:store') as Store).validatorFor,
      validatorFor,
      'validatorFor is injected into sources'
    );
    assert.strictEqual(
      normalizer.schema,
      schema,
      'schema is injected into normalizer'
    );
    assert.strictEqual(
      normalizer.keyMap,
      keyMap,
      'keyMap is injected into normalizer'
    );
    assert.strictEqual(
      (this.owner.lookup('orbit-source:store') as Store).queryBuilder.$normalizer,
      normalizer,
      'normalizer is injected into sources and assigned to query builders'
    );
    assert.strictEqual(
      (this.owner.lookup('orbit-source:store') as Store).transformBuilder.$normalizer,
      normalizer,
      'normalizer is injected into sources and assigned to transform builders'
    );
    assert.ok(
      this.owner.lookup('service:data-schema'),
      'unconfigured lookup type falls back to default configuration'
    );
  });
});
