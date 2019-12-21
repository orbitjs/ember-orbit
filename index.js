'use strict';
const path = require('path');
const assert = require('assert');
const fs = require('fs');

module.exports = {
  name: require('./package').name,
  included() {
    const app = this._findHost();
    const addonConfig = app.project.config(app.env)['orbit'] || {};
    const collections = addonConfig.collections || {};
    const modelsDir = collections.models || 'data-models';
    let modelsPath;

    if (
      app.project.pkg['ember-addon'] &&
      app.project.pkg['ember-addon'].configPath
    ) {
      modelsPath = path.join('tests', 'dummy', 'app', modelsDir);
    } else {
      modelsPath = path.join('app', modelsDir);
    }

    const modelsDirectory = path.join(app.project.root, modelsPath);

    /* eslint-disable ember/no-invalid-debug-function-arguments */
    assert(
      fs.existsSync(modelsDirectory),
      `[ember-orbit] The models directory is missing: "${modelsDirectory}". You can run 'ember g ember-orbit' to initialize ember-orbit and create this directory.`
    );

    this._super.included.apply(this, arguments);
  }
};
