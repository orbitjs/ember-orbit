'use strict';

module.exports = {
  description: 'Generates an ember-orbit model.',

  fileMapTokens() {
    const addonConfig = this.project.config()['orbit'] || {};
    const collections = addonConfig.collections || {};

    return {
      __models__() {
        return collections.models || 'data-models';
      },
    };
  },
};
