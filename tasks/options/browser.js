module.exports = {
  dist: {
    options: {
      name: function(file) {
        file = file.replace('tmp/built/intermediate/', '');
        file = file.replace('.browser.js', '');
        return file;
      },
      modules: function(name) {
        switch (name) {
          case 'ember-orbit':
            return [{
              namespace: 'EO',
              name: 'ember-orbit'
            }];

          default:
            this.fail.warn('Unrecognized file: `' + name + '`.');
        }
      },
      preDefine: function(name) {
        return [
          "var define = global.Orbit.__define__;",
          "var requireModule = global.Orbit.__requireModule__;"
        ];
      }
    },
    files: [{
      expand: true,
      cwd: 'tmp/built/intermediate/',
      src: ['*.browser.js'],
      dest: 'tmp/built/',
      ext: '.js'
    }]
  }
};
