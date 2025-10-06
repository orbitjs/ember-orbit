'use strict';

const DEFAULT_PACKAGE = 'TODO';

module.exports = {
  description: 'Generates an ember-orbit source.',

  availableOptions: [{ name: 'from', type: String, default: DEFAULT_PACKAGE }],

  fileMapTokens() {
    return {
      __sources__() {
        return 'data-sources';
      },
    };
  },

  locals(options) {
    const { from } = options;
    return { from };
  },

  afterInstall(options) {
    if (options.from && options.from !== DEFAULT_PACKAGE) {
      return this.addPackageToProject(options.from);
    }
  },
};
