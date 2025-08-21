'use strict';

const getChannelURL = require('ember-source-channel-url');
const { embroiderSafe, embroiderOptimized } = require('@embroider/test-setup');

module.exports = async function () {
  return {
    packageManager: 'pnpm',
    scenarios: [
      {
        name: 'ember-lts-3.28',
        npm: {
          devDependencies: {
            '@ember/test-helpers': '^2.8.1',
            'ember-cli': '^3.28.0',
            'ember-qunit': '^6.0.0',
            'ember-resolver': '^8.0.3',
            'ember-source': '~3.28.0',
          },
        },
      },
      {
        name: 'ember-lts-4.4',
        npm: {
          devDependencies: {
            '@ember/test-helpers': '^2.8.1',
            'ember-cli': '~4.4.0',
            'ember-qunit': '^6.0.0',
            'ember-resolver': '^8.0.3',
            'ember-source': '~4.4.0',
          },
        },
      },
      {
        name: 'ember-lts-4.12',
        npm: {
          devDependencies: {
            'ember-source': '~4.12.0',
          },
        },
      },
      {
        name: 'ember-lts-5.8',
        npm: {
          devDependencies: {
            'ember-source': '~5.8.0',
          },
        },
      },
      {
        name: 'ember-lts-5.12',
        npm: {
          devDependencies: {
            'ember-source': '~5.12.0',
          },
        },
      },
      {
        name: 'ember-release',
        npm: {
          devDependencies: {
            'ember-source': await getChannelURL('release'),
          },
        },
      },
      {
        name: 'ember-beta',
        npm: {
          devDependencies: {
            'ember-source': await getChannelURL('beta'),
          },
        },
      },
      {
        name: 'ember-canary',
        npm: {
          devDependencies: {
            'ember-source': await getChannelURL('canary'),
          },
        },
      },
      embroiderSafe(),
      embroiderOptimized(),
    ],
  };
};
