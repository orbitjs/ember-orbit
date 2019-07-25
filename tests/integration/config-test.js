import { Planet, Moon, Star } from 'dummy/tests/support/dummy-models';
import { createOwner, createStore } from 'dummy/tests/support/store';
import { module, test } from 'qunit';
import Controller from '@ember/controller';
import Route from '@ember/routing/route';

module('Integration - Config', function(hooks) {
  let owner;
  let store;

  hooks.beforeEach(function() {
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
            keyMap: 'orbit-key-map'
          }
        }
      },
      { instantiate: false }
    );
    const models = { planet: Planet, moon: Moon, star: Star };
    store = createStore({ models, owner });
    owner.register('controller:application', Controller);
    owner.register('route:application', Route);
  });

  hooks.afterEach(function() {
    store = null;
    owner = null;
  });

  test('registrations respect config', async function(assert) {
    assert.equal(
      owner.lookup('service:orbit-store'),
      store,
      'store service registration is named from configuration'
    );
    assert.ok(
      owner.resolveRegistration('orbit-model:planet'),
      'model factory registration is named from configuration'
    );
    assert.ok(
      owner.lookup('orbit-source:store'),
      'source registation is named from configuration'
    );
    assert.ok(
      owner.lookup('orbit-source:store').schema,
      'schema is injected successfully on sources'
    );
    assert.ok(
      owner.lookup('service:data-schema'),
      'unconfigured lookup type falls back to default configuration'
    );
    assert.equal(
      owner.lookup('controller:application').orbitStore,
      store,
      'configured store name is camelized for controller and route injection'
    );
    assert.equal(
      owner.lookup('route:application').orbitStore,
      store,
      'configured store name is camelized for controller and route injection'
    );
  });
});
