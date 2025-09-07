'use strict';

module.exports = {
  description: 'Setup ember-orbit.',

  normalizeEntityName() {
    return '';
  },

  fileMapTokens() {
    const addonConfig = this.project.config()['orbit'] || {};
    const collections = addonConfig.collections || {};

    let tokens = {
      __gitkeep__() {
        return '.gitkeep';
      },
      __buckets__() {
        return collections.buckets || 'data-buckets';
      },
      __models__() {
        return collections.models || 'data-models';
      },
      __sources__() {
        return collections.sources || 'data-sources';
      },
      __strategies__() {
        return collections.strategies || 'data-strategies';
      },
    };

    return tokens;
  },
};
