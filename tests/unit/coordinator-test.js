import { Coordinator as OrbitCoordinator } from '@orbit/data';
import Coordinator from 'ember-orbit/coordinator';
import { dummyModels } from 'dummy/tests/support/dummy-models';
import { createStore } from 'dummy/tests/support/store';
import { module, test } from 'qunit';

const { Planet, Moon, Star } = dummyModels;

module('Unit - Coordinator', function() {
  test('can be instantiated', function(assert) {
    assert.expect(2);

    const coordinator = Coordinator.create();

    assert.ok(coordinator, 'coordinator has been created');
    assert.ok(coordinator.orbitCoordinator instanceof OrbitCoordinator, 'coordinator.orbitCoordinator has been instantiated from Orbit Coordinator');
  });

  test('can be instantiated from an existing Orbit Coordinator', function(assert) {
    assert.expect(2);

    const orbitCoordinator = new OrbitCoordinator();

    const coordinator = Coordinator.create({
      orbitCoordinator
    });

    assert.ok(coordinator, 'coordinator has been created');
    assert.strictEqual(coordinator.orbitCoordinator, orbitCoordinator, 'coordinator.orbitCoordinator matches custom coordinator');
  });

  test('#addSource adds an EO.Source, and #removeSource removes it', function(assert) {
    assert.expect(2);

    const coordinator = Coordinator.create();
    const models = { planet: Planet, moon: Moon, star: Star };
    const store = createStore({ models });

    coordinator.addSource(store);

    assert.ok(coordinator.orbitCoordinator._sources.includes(store.orbitSource), 'source has been added to underlying Orbit coordinator');

    coordinator.removeSource(store);

    assert.ok(!coordinator.orbitCoordinator._sources.includes(store.orbitSource), 'source has been removed from underlying Orbit coordinator');
  });
});
