import { setApplication } from '@ember/test-helpers';
import { start as qunitStart, setupEmberOnerrorValidation } from 'ember-qunit';
import * as QUnit from 'qunit';
import { setup } from 'qunit-dom';
import EmberRouter from '@ember/routing/router';
import EmberApp from 'ember-strict-application-resolver';
import { setupOrbit } from '#src/index.ts';

const dataModels = import.meta.glob('../data-models/*.{js,ts}', {
  eager: true,
});
const dataSources = import.meta.glob('../data-sources/*.{js,ts}', {
  eager: true,
});
const dataStrategies = import.meta.glob('../data-strategies/*.{js,ts}', {
  eager: true,
});

setupOrbit({
  ...dataModels,
  ...dataSources,
  ...dataStrategies,
});

class Router extends EmberRouter {
  location = 'none';
  rootURL = '/';
}

Router.map(function () {
  this.route('filtered');
});

class TestApp extends EmberApp {
  modules = {
    './router': { default: Router },
    ...import.meta.glob('./**/*.{js,ts,gjs,gts}', { eager: true }),
  };
}

export function start() {
  const applicationInstance = TestApp.create({
    autoboot: false,
    rootElement: '#ember-testing',
  });

  setApplication(applicationInstance);

  setup(QUnit.assert);
  setupEmberOnerrorValidation();
  qunitStart();
}
