import { module, test } from 'qunit';
import { orbitRegistry } from '../../src/-private/utils/orbit-registry.ts';
import { orbit, type OrbitServiceRegistry } from '../../src/index.ts';

module('Unit | Decorator | orbit', function (hooks) {
  hooks.beforeEach(function () {
    // Mock some services in the orbit registry for testing
    orbitRegistry.registrations.services['data-coordinator'] = {} as any;
    orbitRegistry.registrations.services['store'] = {} as any;
    orbitRegistry.registrations.services['data-schema'] = {} as any;
  });

  hooks.afterEach(function () {
    // Clean up
    orbitRegistry.registrations.services = {} as any;
  });
  test('orbit decorator with automatic type inference', function (assert) {
    // Services should already be registered by setupOrbit
    class TestClass {
      @orbit('data-coordinator')
      dataCoordinator: any;

      @orbit('store')
      store: any;

      @orbit('data-schema')
      dataSchema: any;
    }

    const instance = new TestClass();

    // Debug: Check what's happening
    console.log('Instance created:', instance);
    console.log(
      'Available services:',
      Object.keys(orbitRegistry.registrations.services),
    );
    console.log('Accessing dataCoordinator...');
    const coordinator = instance.dataCoordinator;
    console.log('Got coordinator:', coordinator);

    // Just verify the services are injected (they should be real service instances)
    assert.ok(coordinator, 'orbit decorator resolves data-coordinator');
    assert.ok(instance.store, 'orbit decorator resolves store');
    assert.ok(instance.dataSchema, 'orbit decorator resolves data-schema');
  });

  test('orbit decorator shows helpful error for missing services', function (assert) {
    class TestClass {
      @orbit('nonexistent-service' as any)
      declare nonexistent: any;
    }

    const instance = new TestClass();

    assert.throws(
      () => instance.nonexistent,
      /No orbit service named 'nonexistent-service' was found/,
      'orbit decorator throws helpful error for missing service',
    );
  });
});
