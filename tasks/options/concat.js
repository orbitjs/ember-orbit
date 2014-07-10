module.exports = {
  amd: {
    files: {
      'tmp/built/ember-orbit.amd.js': [
          'tmp/transpiled/lib/ember-orbit.amd.js',
          'tmp/transpiled/lib/ember-orbit/**/*.amd.js']
    }
  },

  browser: {
    files: {
      'tmp/built/intermediate/ember-orbit.browser.js': [
          'tmp/built/ember-orbit.amd.js']
    }
  },

  tests: {
    files: {
      'tmp/public/test/tests/tests.amd.js': ['tmp/transpiled/tests/**/*.amd.js']
    }
  }
};
