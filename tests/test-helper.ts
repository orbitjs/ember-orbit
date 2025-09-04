import { setApplication } from '@ember/test-helpers';
import { start as qunitStart, setupEmberOnerrorValidation } from 'ember-qunit';
import * as QUnit from 'qunit';
import { setup } from 'qunit-dom';
import EmberApp from 'ember-strict-application-resolver';
import EmberRouter from '@ember/routing/router';

class Router extends EmberRouter {
  location = 'none';
  rootURL = '/';
}

class TestApp extends EmberApp {
  modules = {
    './router': { default: Router },
    ...import.meta.glob('./test-app/**/*.{js,ts,gjs,gts}', { eager: true }),
  };
}

Router.map(function () {
  this.route('filtered');
});

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
