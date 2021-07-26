import { Store, Cache } from 'ember-orbit';
import { Planet, Moon } from 'dummy/tests/support/dummy-models';
import { createStore } from 'dummy/tests/support/store';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, settled } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module('Rendering', function (hooks) {
  let store: Store;
  let cache: Cache;

  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    const models = { planet: Planet, moon: Moon };
    store = createStore(this.owner, models).fork();
    cache = store.cache;
  });

  test('update relationship synchronously via cache', async function (assert) {
    const jupiter = cache.addRecord({ type: 'planet', name: 'Jupiter' });
    this.set('planet', jupiter);

    await render(hbs`<MoonsList @planet={{this.planet}} />`);

    assert.dom('.moons li').doesNotExist();

    cache.addRecord({
      type: 'moon',
      name: 'Callisto',
      planet: jupiter
    });

    await settled();
    assert.dom('.moons').includesText('Callisto');

    const europa = cache.addRecord<Moon>({
      type: 'moon',
      name: 'Europa',
      planet: jupiter
    });

    await settled();
    assert.dom('.moons').includesText('Europa');

    europa.name = 'New Europa';

    await settled();
    assert.dom('.moons').includesText('New Europa');

    europa.$remove();

    await settled();
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

  test('liveQuery records - accessed via liveQuery.value', async function (assert) {
    const planets = cache.liveQuery((q) => q.findRecords('planet'));
    this.set('planets', planets);

    await render(hbs`<PlanetsList @planets={{this.planets.value}} />`);

    assert.dom('.planets').hasNoText();

    await store.addRecord({ type: 'planet', name: 'Jupiter' });
    assert.dom('.planets').includesText('Jupiter');

    assert.dom('.planets-count').includesText('1');

    await store.addRecord({ type: 'planet', name: 'Earth' });
    assert.dom('.planets').includesText('Earth');

    assert.dom('.planets-count').includesText('2');
  });

  test('liveQuery records - accessed via liveQuery directly', async function (assert) {
    const planets = cache.liveQuery((q) => q.findRecords('planet'));
    this.set('planets', planets);

    await render(hbs`<PlanetsList @planets={{this.planets}} />`);

    assert.dom('.planets').hasNoText();

    await store.addRecord({ type: 'planet', name: 'Jupiter' });
    assert.dom('.planets').includesText('Jupiter');

    assert.dom('.planets-count').includesText('1');

    await store.addRecord({ type: 'planet', name: 'Earth' });
    assert.dom('.planets').includesText('Earth');

    assert.dom('.planets-count').includesText('2');
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
