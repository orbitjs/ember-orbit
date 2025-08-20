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
      },
    };
  },

  locals(options) {
    let { type } = options;
    let name = options.entity.name;
    let source = 'TODO';
    let target = 'TODO';
    let on = 'TODO';
    let action = 'TODO';
    let strategyClass;

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
      strategyClass = 'SyncStrategy';
      let segments = name.split('-');
      if (segments.length >= 2) {
        source = segments[0];
        target = segments[1];
      }
    } else if (type === 'request') {
      strategyClass = 'RequestStrategy';
      let segments = name.split('-');
      if (segments.length >= 2) {
        source = segments[0];
        on = segments[1];

        if (on === on.toLowerCase()) {
          if (on.indexOf('before') === 0) {
            on = `before${on.substr(6, 1).toUpperCase()}${on.substr(7)}`;
          } else if (on.indexOf('fail') === on.length - 4) {
            on = `${on.substr(0, on.length - 4)}Fail`;
          }
        }

        if (segments.length >= 3) {
          target = segments[2];
          if (segments.length >= 4) {
            action = segments[3];
          }
        }
      }
    } else if (type === 'event-logging') {
      strategyClass = 'EventLoggingStrategy';
    } else if (type === 'log-truncation') {
      strategyClass = 'LogTruncationStrategy';
    }

    return { type, strategyClass, source, target, on, action };
  },
};
