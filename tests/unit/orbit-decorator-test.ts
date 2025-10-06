import { module, test } from 'qunit';
import { orbitRegistry } from '../../src/-private/utils/orbit-registry.ts';
import { orbit, type OrbitServiceRegistry } from '../../src/index.ts';

module('Unit | Decorator | orbit', function () {
  test('orbit decorator with automatic type inference', function (assert) {
    // Services should already be registered by setupOrbit
    class TestClass {
      @orbit('data-coordinator')
      declare dataCoordinator: any;

      @orbit('store')
      declare store: any;

      @orbit('data-schema')
      declare dataSchema: any;
    }

    const instance = new TestClass();

    // Just verify the services are injected (they should be real service instances)
    assert.ok(
      instance.dataCoordinator,
      'orbit decorator resolves data-coordinator',
    );
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
