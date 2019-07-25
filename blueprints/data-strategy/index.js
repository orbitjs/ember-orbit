'use strict';

const availableTypes = ['request', 'sync', 'event-logging', 'log-truncation'];

module.exports = {
  description: 'Generates an ember-orbit coordination strategy.',

  availableOptions: [{ name: 'type', type: availableTypes }],

  fileMapTokens() {
    const addonConfig = this.project.config()['orbit'] || {};
    const collections = addonConfig.collections || {};

    return {
      __strategies__() {
        return collections.strategies || 'data-strategies';
      }
    };
  },

  locals(options) {
    let { type } = options;
    let name = options.entity.name;

    if (type === undefined) {
      if (availableTypes.includes(name)) {
        type = name;
      } else if (name.indexOf('sync') > -1) {
        type = 'sync';
      } else {
        type = 'request';
      }
    }

    return { type };
  }
};
