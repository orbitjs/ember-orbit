'use strict';

module.exports = {
  description: 'Setup ember-orbit.',

  normalizeEntityName() {
    return '';
  },

  fileMapTokens() {
    let tokens = {
      __gitkeep__() {
        return '.gitkeep';
      },
      __buckets__() {
        return 'data-buckets';
      },
      __models__() {
        return 'data-models';
      },
      __sources__() {
        return 'data-sources';
      },
      __strategies__() {
        return 'data-strategies';
      },
    };

    return tokens;
  },
};
