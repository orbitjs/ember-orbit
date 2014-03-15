module.exports = {
  tests: {
    files: [{
      expand: true,
      cwd: 'vendor/',
      src: ['**/*.js'],
      dest: 'tmp/public/test/vendor/'
    }, {
      expand: true,
      flatten: true,
      filter: 'isFile',
      cwd: 'bower_components/',
      src: ['ember/ember.js',
            'handlebars/handlebars.js',
            'jquery/jquery.js',
            'qunit/qunit/qunit.js',
            'qunit/qunit/qunit.css',
            'orbit.js/*.amd.js'],
      dest: 'tmp/public/test/vendor/'
    }, {
      expand: true,
      cwd: 'test/',
      src: ['index.html', 'test_loader.js'],
      dest: 'tmp/public/test/'
    }, {
      expand: true,
      cwd: 'tmp/built/',
      src: ['*.amd.js'],
      dest: 'tmp/public/test/lib/'
    }]
  },
  dist: {
    files: [{
      expand: true,
      cwd: 'tmp/built/',
      src: ['*.js'],
      dest: 'dist/'
    }]
  },
};
