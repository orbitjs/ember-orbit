import { module, test } from 'qunit';
import { visit, currentURL, click, triggerEvent } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';

module('Acceptance | filtered', function (hooks) {
  setupApplicationTest(hooks);

  test('visiting /filtered', async function (assert) {
    await visit('/filtered');

    assert.equal(currentURL(), '/filtered');

    assert.dom('.planet-row').exists({ count: 2 });
    assert.dom('.moons li').exists({ count: 2 });

    await this.pauseTest();
    await click('[data-test-duplicate="Pluto"]');

    assert.dom('.planet-row').exists({ count: 3 });
    assert.dom('.moons li').exists({ count: 4 });

    // undo
    await triggerEvent(document.body, 'keydown', {
      keyCode: 90,
      ctrlKey: true,
    });

    assert.dom('.planet-row').exists({ count: 2 });
    assert.dom('.moons li').exists({ count: 2 });

    // redo
    await triggerEvent(document.body, 'keydown', {
      keyCode: 90,
      ctrlKey: true,
      shiftKey: true,
    });

    assert.dom('.planet-row').exists({ count: 3 });
    assert.dom('.moons li').exists({ count: 4 });
  });
});
