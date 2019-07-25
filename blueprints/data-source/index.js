'use strict';

module.exports = {
  description: 'Generates an ember-orbit source.',

  availableOptions: [{ name: 'from', type: String, default: 'TODO' }],

  fileMapTokens() {
    const addonConfig = this.project.config()['orbit'] || {};
    const collections = addonConfig.collections || {};

    return {
      __sources__() {
        return collections.sources || 'data-sources';
      }
    };
  },

  locals(options) {
    const { from } = options;
    return { from };
  }
};
