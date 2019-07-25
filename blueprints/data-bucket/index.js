'use strict';

module.exports = {
  description: 'Generates an ember-orbit bucket.',

  availableOptions: [
    { name: 'from', type: String, default: '@orbit/indexeddb-bucket' },
    { name: 'namespace', type: String }
  ],

  fileMapTokens() {
    const addonConfig = this.project.config()['orbit'] || {};
    const collections = addonConfig.collections || {};

    return {
      __buckets__() {
        return collections.buckets || 'data-buckets';
      }
    };
  },

  locals(options) {
    const { from, namespace } = options;
    return { from, namespace };
  }
};
