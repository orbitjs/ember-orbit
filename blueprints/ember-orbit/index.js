'use strict';

module.exports = {
  description: 'Setup ember-orbit.',

  normalizeEntityName() {
    return '';
  },

  renamedFiles: {
    gitkeep: 'app/orbit-models/.gitkeep'
  },

  fileMapTokens() {
    const addonConfig = this.project.config()['orbit'] || {};
    const collections = addonConfig.collections || {};

    let tokens = {
      __gitkeep__() {
        return '.gitkeep';
      },
      __models__() {
        return collections.models || 'data-models';
      },
      __sources__() {
        return collections.sources || 'data-sources';
      },
      __strategies__() {
        return collections.strategies || 'data-strategies';
      }
    };

    return tokens;
  }
};
