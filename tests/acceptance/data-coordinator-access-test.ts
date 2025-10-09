import { visit } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { module, test } from 'qunit';
import type ApplicationRoute from '../test-app/routes/application';

module('Acceptance | data coordinator access', function (hooks) {
  setupApplicationTest(hooks);

  test('can access backup source via dataCoordinator.getSource', async function (assert) {
    await visit('/');

    const applicationRoute = this.owner.lookup(
      'route:application',
    ) as ApplicationRoute;

    assert.ok(
      applicationRoute.dataCoordinator,
      'dataCoordinator is available on application route',
    );

    const backupSource = applicationRoute.dataCoordinator.getSource('backup');

    assert.ok(
      backupSource,
      'backup source is accessible via dataCoordinator.getSource',
    );
    assert.equal(backupSource.name, 'backup', 'backup source has correct name');
  });

  test('returns undefined for non-existent sources', async function (assert) {
    await visit('/');

    const applicationRoute = this.owner.lookup(
      'route:application',
    ) as ApplicationRoute;
    const nonExistentSource =
      applicationRoute.dataCoordinator.getSource('non-existent');

    assert.equal(
      nonExistentSource,
      undefined,
      'non-existent source returns undefined',
    );
  });

  test('can access all configured sources', async function (assert) {
    await visit('/');

    const applicationRoute = this.owner.lookup(
      'route:application',
    ) as ApplicationRoute;

    // Test access to valid sources defined in test-app/data-sources/
    const storeSource = applicationRoute.dataCoordinator.getSource('store');
    const backupSource = applicationRoute.dataCoordinator.getSource('backup');

    // The null source is intentionally invalid (doesn't export { create }) and should be ignored
    const nullSource = applicationRoute.dataCoordinator.getSource('null');

    assert.ok(storeSource, 'store source is accessible');
    assert.ok(backupSource, 'backup source is accessible');
    assert.equal(
      nullSource,
      undefined,
      'null source is ignored because it has invalid shape',
    );

    assert.equal(storeSource.name, 'store', 'store source has correct name');
    assert.equal(backupSource.name, 'backup', 'backup source has correct name');
  });
});
