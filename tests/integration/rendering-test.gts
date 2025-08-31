import { Store, Cache } from '#src/index.ts';
import { Planet, Moon } from '../support/dummy-models';
import { createStore } from '../support/store';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, settled } from '@ember/test-helpers';
import type ApplicationInstance from '@ember/application/instance';
import type { TOC } from '@ember/component/template-only';

const PlanetComponent = <template>
  <div class="planet">
    {{@planet.name}}
  </div>
</template> satisfies TOC<{ Args: { planet: Planet } }>;

const PlanetsList = <template>
  <ul class="planets">
    {{#each @planets as |planet|}}
      <li>
        {{planet.name}}
      </li>
    {{/each}}
  </ul>
  <div class="planets-count">{{@planets.length}}</div>
</template> satisfies TOC<{ Args: { planets: Array<Planet> } }>;

module('Rendering', function (hooks) {
  let store: Store;
  let cache: Cache;

  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    const models = { planet: Planet, moon: Moon };
    store = createStore(this.owner as ApplicationInstance, models).fork();
    cache = store.cache;
  });

  test('connected / disconnected models', async function (assert) {
    const jupiter = cache.addRecord({ type: 'planet', name: 'Jupiter' });

    await render(
      <template>
        <h1>
          {{#if jupiter.$isDisconnected}}
            Disconnected
          {{else}}
            Connected
          {{/if}}
        </h1>
      </template>,
    );

    assert.dom('h1').includesText('Connected');

    jupiter.$disconnect();
    await settled();

    assert.dom('h1').includesText('Disconnected');
  });

  test('persistent properties, event when models are disconnected', async function (assert) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const jupiter = cache.addRecord({
      type: 'planet',
      name: 'Jupiter',
    }) as Planet;

    await render(
      <template>
        <h1>
          {{jupiter.name}}
        </h1>
      </template>,
    );

    assert.dom('h1').includesText('Jupiter');

    jupiter.$disconnect();
    await settled();

    assert.dom('h1').includesText('Jupiter');
  });

  test('update relationship synchronously via cache', async function (assert) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const jupiter = cache.addRecord({
      type: 'planet',
      name: 'Jupiter',
    }) as Planet;

    await render(
      <template>
        <ul class="moons">
          {{#each jupiter.moons as |moon|}}
            <li>
              {{moon.name}}
            </li>
          {{/each}}
        </ul>
      </template>,
    );

    assert.dom('.moons li').doesNotExist();

    cache.addRecord({
      type: 'moon',
      name: 'Callisto',
      planet: jupiter,
    });

    await settled();
    assert.dom('.moons').includesText('Callisto');

    const europa = cache.addRecord<Moon>({
      type: 'moon',
      name: 'Europa',
      planet: jupiter,
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
    const planets = cache.liveQuery((q) =>
      q.findRecords('planet'),
    ) as unknown as Array<Planet>;

    await render(<template><PlanetsList @planets={{planets}} /></template>);

    assert.dom('.planets').hasNoText();

    await store.addRecord({ type: 'planet', name: 'Jupiter' });
    assert.dom('.planets').includesText('Jupiter');

    await store.addRecord({ type: 'planet', name: 'Earth' });
    assert.dom('.planets').includesText('Earth');
  });

  test('liveQuery records - accessed via liveQuery.value', async function (assert) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const planets = cache.liveQuery((q) => q.findRecords('planet')) as any;

    await render(
      <template><PlanetsList @planets={{planets.value}} /></template>,
    );

    assert.dom('.planets').hasNoText();

    await store.addRecord({ type: 'planet', name: 'Jupiter' });
    assert.dom('.planets').includesText('Jupiter');

    assert.dom('.planets-count').includesText('1');

    await store.addRecord({ type: 'planet', name: 'Earth' });
    assert.dom('.planets').includesText('Earth');

    assert.dom('.planets-count').includesText('2');
  });

  test('liveQuery records - accessed via liveQuery directly', async function (assert) {
    const planets = cache.liveQuery((q) =>
      q.findRecords('planet'),
    ) as unknown as Array<Planet>;

    await render(<template><PlanetsList @planets={{planets}} /></template>);

    assert.dom('.planets').hasNoText();

    await store.addRecord({ type: 'planet', name: 'Jupiter' });
    assert.dom('.planets').includesText('Jupiter');

    assert.dom('.planets-count').includesText('1');

    await store.addRecord({ type: 'planet', name: 'Earth' });
    assert.dom('.planets').includesText('Earth');

    assert.dom('.planets-count').includesText('2');
  });

  test('liveQuery record - accessed via `value` of LiveQuery', async function (assert) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const planet = cache.liveQuery((q) =>
      q.findRecord({ type: 'planet', id: '1' }),
    ) as any;

    await render(
      <template><PlanetComponent @planet={{planet.value}} /></template>,
    );

    assert.dom('.planet').hasNoText();

    await store.addRecord({ type: 'planet', id: '1', name: 'Jupiter' });
    assert.dom('.planet').includesText('Jupiter');

    await store.removeRecord({ type: 'planet', id: '1' });
    assert.dom('.planet').hasNoText('Earth');
  });

  test('liveQuery record - accessed via deprecated `content` of LiveQuery', async function (assert) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const planet = cache.liveQuery((q) =>
      q.findRecord({ type: 'planet', id: '1' }),
    ) as any;

    await render(
      <template><PlanetComponent @planet={{planet.content}} /></template>,
    );

    assert.dom('.planet').hasNoText();

    await store.addRecord({ type: 'planet', id: '1', name: 'Jupiter' });
    assert.dom('.planet').includesText('Jupiter');

    await store.removeRecord({ type: 'planet', id: '1' });
    assert.dom('.planet').hasNoText('Earth');
  });
});
