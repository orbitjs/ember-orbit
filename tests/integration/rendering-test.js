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

  test('liveQuery iterator', async function (assert) {
    const planets = cache.liveQuery((q) => q.findRecords('planet'));
    this.set('planets', planets);

    await render(hbs`<PlanetsList @planets={{this.planets}} />`);

    assert.dom('.planets').hasNoText();

    await store.addRecord({ type: 'planet', name: 'Jupiter' });
    assert.dom('.planets').includesText('Jupiter');

    await store.addRecord({ type: 'planet', name: 'Earth' });
    assert.dom('.planets').includesText('Earth');
  });

  test('liveQuery records', async function (assert) {
    const planets = cache.liveQuery((q) => q.findRecords('planet'));
    this.set('planets', planets);

    await render(hbs`<PlanetsList @planets={{this.planets.value}} />`);

    assert.dom('.planets').hasNoText();

    await store.addRecord({ type: 'planet', name: 'Jupiter' });
    assert.dom('.planets').includesText('Jupiter');

    await store.addRecord({ type: 'planet', name: 'Earth' });
    assert.dom('.planets').includesText('Earth');
  });

  test('liveQuery record', async function (assert) {
    const planet = cache.liveQuery((q) =>
      q.findRecord({ type: 'planet', id: '1' })
    );
    this.set('planet', planet);

    await render(hbs`<Planet @planet={{this.planet.value}} />`);

    assert.dom('.planet').hasNoText();

    await store.addRecord({ type: 'planet', id: '1', name: 'Jupiter' });
    assert.dom('.planet').includesText('Jupiter');

    await store.removeRecord({ type: 'planet', id: '1' });
    assert.dom('.planet').hasNoText('Earth');
  });
});
