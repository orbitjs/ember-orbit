import { setApplication } from '@ember/test-helpers';
import { start as qunitStart, setupEmberOnerrorValidation } from 'ember-qunit';
import * as QUnit from 'qunit';
import { setup } from 'qunit-dom';
import EmberRouter from '@ember/routing/router';
import EmberApp from 'ember-strict-application-resolver';

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
