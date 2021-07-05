import { Store } from 'ember-orbit';
import { Planet, Moon, Star } from 'dummy/tests/support/dummy-models';
import { createOwner, createStore } from 'dummy/tests/support/store';
import { module, test } from 'qunit';

module('Integration - Config', function (hooks) {
  let owner: any;
  let store: Store;

  hooks.beforeEach(function () {
    owner = createOwner();
    owner.register(
      'config:environment',
      {
        orbit: {
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
    store = createStore({ models, owner });
  });

  test('registrations respect config', async function (assert) {
    const schema = owner.lookup('service:data-schema');
    const keyMap = owner.lookup('service:orbit-key-map');
    const normalizer = owner.lookup('service:orbit-normalizer');
    const validatorFor = owner.lookup('service:orbit-validator');

    assert.equal(
      owner.lookup('service:orbit-store'),
      store,
      'store service registration is named from configuration'
    );
    assert.ok(
      owner.resolveRegistration('orbit-model:planet'),
      'model factory registration is named from configuration'
    );
    assert.strictEqual(
      owner.lookup('orbit-source:store'),
      store.source,
      'source registation is named from configuration'
    );
    assert.strictEqual(
      owner.lookup('orbit-source:store').schema,
      schema,
      'schema is injected into sources'
    );
    assert.strictEqual(
      owner.lookup('orbit-source:store').keyMap,
      keyMap,
      'keyMap is injected into sources'
    );
    assert.strictEqual(
      owner.lookup('orbit-source:store').validatorFor,
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
      owner.lookup('orbit-source:store').queryBuilder.$normalizer,
      normalizer,
      'normalizer is injected into sources and assigned to query builders'
    );
    assert.strictEqual(
      owner.lookup('orbit-source:store').transformBuilder.$normalizer,
      normalizer,
      'normalizer is injected into sources and assigned to transform builders'
    );
    assert.ok(
      owner.lookup('service:data-schema'),
      'unconfigured lookup type falls back to default configuration'
    );
  });
});
