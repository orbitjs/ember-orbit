'use strict';
const path = require('path');
const assert = require('assert');
const fs = require('fs');

module.exports = {
  name: require('./package').name,
  included() {
    const app = this._findHost();
    const addonConfig = this.app.project.config(app.env)['orbit'] || {};
    const collections = addonConfig.collections || {};
    let modelsPath;

    if (collections.models) {
      modelsPath = path.join('app', collections.models);
    } else if (
      app.project.pkg['ember-addon'] &&
      app.project.pkg['ember-addon'].configPath
    ) {
      modelsPath = path.join('tests', 'dummy', 'app', 'data-models');
    } else {
      modelsPath = path.join('app', 'data-models');
    }

    const modelsDirectory = path.join(app.project.root, modelsPath);

    assert(
      fs.existsSync(modelsDirectory),
      `You need to create models directory: "${modelsDirectory}"`
    );

    this._super.included.apply(this, arguments);
  }
};
