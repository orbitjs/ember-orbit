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
    let source = 'TODO';
    let target = 'TODO';
    let on = 'TODO';
    let action = 'TODO';

    if (type === undefined) {
      if (availableTypes.includes(name)) {
        type = name;
      } else if (name.indexOf('sync') > -1) {
        type = 'sync';
      } else {
        type = 'request';
      }
    }

    if (type === 'sync') {
      let segments = name.split('-');
      if (segments.length >= 2) {
        source = segments[0];
        target = segments[1];
      }
    } else if (type === 'request') {
      let segments = name.split('-');
      if (segments.length >= 4) {
        source = segments[0];
        on = segments[1];
        target = segments[2];
        action = segments[3];
      }
    }

    return { type, source, target, on, action };
  }
};
