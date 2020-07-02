import { Planet, Moon } from 'dummy/tests/support/dummy-models';
import { createStore } from 'dummy/tests/support/store';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { waitForSource } from 'ember-orbit/test-support';

module('Rendering', function (hooks) {
  let store;
  let cache;

  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    const models = { planet: Planet, moon: Moon };
    store = createStore({ models });
    cache = store.cache;
  });

  hooks.afterEach(function () {
    store = null;
    cache = null;
  });

  test('update has many', async function (assert) {
    const jupiter = await store.addRecord({ type: 'planet', name: 'Jupiter' });
    this.set('planet', cache.peekRecord('planet', jupiter.id));

    await render(hbs`<MoonsList @planet={{this.planet}} />`);

    assert.dom('.moons li').doesNotExist();

    await store.addRecord({
      type: 'moon',
      name: 'Callisto',
      planet: jupiter
    });

    assert.dom('.moons').includesText('Callisto');

    const europa = await store.addRecord({
      type: 'moon',
      name: 'Europa',
      planet: jupiter
    });

    assert.dom('.moons').includesText('Europa');

    europa.name = 'New Europa';

    await waitForSource(store);

    assert.dom('.moons').includesText('New Europa');

    await europa.remove();

    assert.dom('.moons').doesNotIncludeText('New Europa');
  });
});
