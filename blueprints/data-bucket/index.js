'use strict';

module.exports = {
  description: 'Generates an ember-orbit bucket.',

  availableOptions: [
    { name: 'from', type: String, default: '@orbit/indexeddb-bucket' },
    { name: 'namespace', type: String },
  ],

  fileMapTokens() {
    return {
      __buckets__(options) {
        return options.locals.bucketsCollection;
      },
      __initializer__(options) {
        return options.locals.initializerName;
      },
    };
  },

  locals(options) {
    const { from, namespace } = options;
    const addonConfig = this.project.config()['orbit'] || {};
    const collections = addonConfig.collections || {};

    return {
      from,
      namespace,
      // TODO: figure out what we need with buckets here
      bucketsCollection: collections.buckets || 'data-buckets',
      initializerName: `${options.entity.name}-bucket-initializer`,
      serviceName: `${options.entity.name}-bucket`,
    };
  },

  afterInstall(options) {
    if (options.from) {
      return this.addPackageToProject(options.from);
    }
  },
};
