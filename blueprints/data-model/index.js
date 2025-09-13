'use strict';

module.exports = {
  description: 'Generates an ember-orbit model.',

  fileMapTokens() {
    return {
      __models__() {
        return 'data-models';
      },
    };
  },
};
