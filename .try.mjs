// When building your addon for older Ember versions you need to have the required files
const compatFiles = {
  'ember-cli-build.js': `const EmberApp = require('ember-cli/lib/broccoli/ember-app');
const { compatBuild } = require('@embroider/compat');
module.exports = async function (defaults) {
  const { buildOnce } = await import('@embroider/vite');
  let app = new EmberApp(defaults);
  return compatBuild(app, buildOnce);
};`,
  'config/optional-features.json': JSON.stringify({
    'application-template-wrapper': false,
    'default-async-observers': true,
    'jquery-integration': false,
    'template-only-glimmer-components': true,
    'no-implicit-route-model': true,
  }),
};

const compatDeps = {
  '@embroider/compat': '^4.0.3',
  'ember-cli': '^5.12.0',
  'ember-auto-import': '^2.10.0',
  '@ember/optional-features': '^2.2.0',
};

export default {
  scenarios: [
    {
      name: 'ember-lts-3.28',
      npm: {
        dependencies: {
          'ember-auto-import': '^2.10.0',
          'ember-cli-htmlbars': '^6.3.0',
        },
        devDependencies: {
          '@ember/optional-features': '^2.2.0',
          '@ember/string': '^3.1.1',
          'ember-cli': '^4.12.0',
          'ember-exam': '^6.1.0',
          'ember-source': '^3.28.0',
        },
      },
      env: {
        ENABLE_COMPAT_BUILD: true,
      },
      files: compatFiles,
    },
    {
      name: 'ember-lts-4.4',
      npm: {
        dependencies: {
          'ember-auto-import': '^2.10.0',
          'ember-cli-htmlbars': '^6.3.0',
        },
        devDependencies: {
          '@ember/optional-features': '^2.2.0',
          '@ember/string': '^3.1.1',
          'ember-cli': '~4.12.0',
          'ember-source': '~4.4.0',
        },
      },
      env: {
        ENABLE_COMPAT_BUILD: true,
      },
      files: compatFiles,
    },
    {
      name: 'ember-lts-4.8',
      npm: {
        dependencies: {
          'ember-auto-import': '^2.10.0',
          'ember-cli-htmlbars': '^6.3.0',
        },
        devDependencies: {
          '@ember/optional-features': '^2.2.0',
          '@ember/string': '^3.1.1',
          'ember-cli': '~4.12.0',
          'ember-source': '~4.8.0',
        },
      },
      env: {
        ENABLE_COMPAT_BUILD: true,
      },
      files: compatFiles,
    },
    {
      name: 'ember-lts-4.12',
      npm: {
        dependencies: {
          'ember-auto-import': '^2.10.0',
          'ember-cli-htmlbars': '^6.3.0',
        },
        devDependencies: {
          '@ember/optional-features': '^2.2.0',
          '@ember/string': '^3.1.1',
          'ember-cli': '^4.12.0',
          'ember-source': '~4.12.0',
        },
      },
      env: {
        ENABLE_COMPAT_BUILD: true,
      },
      files: compatFiles,
    },
    {
      name: 'ember-lts-5.8',
      npm: {
        devDependencies: {
          'ember-source': '~5.8.0',
          ...compatDeps,
        },
      },
      env: {
        ENABLE_COMPAT_BUILD: true,
      },
      files: compatFiles,
    },
    {
      name: 'ember-lts-5.12',
      npm: {
        devDependencies: {
          'ember-source': '~5.12.0',
          ...compatDeps,
        },
      },
      env: {
        ENABLE_COMPAT_BUILD: true,
      },
      files: compatFiles,
    },
    {
      name: `ember-lts-6.4`,
      npm: {
        devDependencies: {
          'ember-source': `npm:ember-source@~6.4.0`,
        },
      },
    },
    {
      name: `ember-latest`,
      npm: {
        devDependencies: {
          'ember-source': `npm:ember-source@latest`,
        },
      },
    },
    {
      name: `ember-beta`,
      npm: {
        devDependencies: {
          'ember-source': `npm:ember-source@beta`,
        },
      },
    },
    {
      name: `ember-alpha`,
      npm: {
        devDependencies: {
          'ember-source': `npm:ember-source@alpha`,
        },
      },
    },
  ],
};
