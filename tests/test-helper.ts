/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import EmberApp from '@ember/application';
import Resolver from 'ember-resolver';
import EmberRouter from '@ember/routing/router';
import * as QUnit from 'qunit';
import { setApplication } from '@ember/test-helpers';
import { setup } from 'qunit-dom';
import { start as qunitStart, setupEmberOnerrorValidation } from 'ember-qunit';
import { initialize as orbitConfigInitialize } from '#src/instance-initializers/ember-orbit-config.ts';
import { initialize as orbitServicesInitialize } from '#src/instance-initializers/ember-orbit-services.ts';
// @ts-expect-error TODO: convert these to TS
import ApplicationRoute from './test-app/routes/application.gjs';
// @ts-expect-error TODO: convert these to TS
import FilteredRoute from './test-app/routes/filtered.gjs';
// @ts-expect-error TODO: convert these to TS
import UndoManager from './test-app/services/undo-manager.js';
import type ApplicationInstance from '@ember/application/instance';

class Router extends EmberRouter {
  location = 'none';
  rootURL = '/';
}

class TestApp extends EmberApp {
  modulePrefix = 'test-app';
  Resolver = Resolver.withModules({
    'test-app/routes/application': { default: ApplicationRoute },
    'test-app/routes/filtered': { default: FilteredRoute },
    'test-app/router': { default: Router },
    'test-app/services/undo-manager': { default: UndoManager },
    // add any custom services here
  });
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

  orbitConfigInitialize(applicationInstance as unknown as ApplicationInstance);
  orbitServicesInitialize(
    applicationInstance as unknown as ApplicationInstance,
  );

  setup(QUnit.assert);
  setupEmberOnerrorValidation();
  qunitStart();
}
