import { setupTest } from 'ember-qunit';
import { module, test } from 'qunit';
import { Store } from '#src/index.ts';
import { PlanetarySystem } from '../support/dummy-models';
import { createStore } from '../support/store';

// Data model files are kebab-case on disk, so `import.meta.glob` hands
// `setupOrbit` keys like `../data-models/planetary-system.ts` while record
// types stay camelCase. Registering under a kebab-case key must still produce
// a model reachable as `planetarySystem`.
module('Integration - kebab-case model file names', function (hooks) {
  setupTest(hooks);

  let store: Store;

  hooks.beforeEach(function () {
    store = createStore(this.owner, {
      'planetary-system': PlanetarySystem,
    });
  });

  test('the model is present in the schema under its camelCase type', function (assert) {
    assert.true(
      store.schema.hasModel('planetarySystem'),
      'schema knows the camelCase type',
    );
  });

  test('records of that type can be added', async function (assert) {
    const system = await store.addRecord<PlanetarySystem>({
      type: 'planetarySystem',
      name: 'Home',
    });

    assert.strictEqual(system.name, 'Home', 'record was created');
  });
});
