'use strict';

var path       = require('path');
var fs         = require('fs');
var pickFiles  = require('broccoli-static-compiler');
var mergeTrees = require('broccoli-merge-trees');
var _          = require('underscore');

function EmberCLIEmberOrbit(project) {
  this.project = project;
  this.name    = 'Ember CLI Ember Orbit';
}

function unwatchedTree(dir) {
  return {
    read:    function() { return dir; },
    cleanup: function() { }
  };
}

EmberCLIEmberOrbit.prototype.treeFor = function treeFor(name) {
  if (name === 'vendor') {
    var distPath = path.join(__dirname, '..', 'dist');
    var dist = pickFiles(distPath, {
      srcDir: '/',
      files: ['ember-orbit.js'],
      destDir: '/'
    });

    var orbitPath = path.join(__dirname, '..', 'bower_components', 'orbit.js');
    var orbit = pickFiles(orbitPath, {
      srcDir: '/',
      files: ['orbit.js', 'orbit-common.js', 'orbit-common-jsonapi.js', 'orbit-common-local-storage.js'],
      destDir: '/'
    });

    return mergeTrees([dist, orbit]);
  }
};

EmberCLIEmberOrbit.prototype.included = function included(app) {
  this.app = app;

  var imports = app.options.getEnvJSON(this.app.env).ORBIT.IMPORTS;

  _.each(imports, function(imp) {
    app.import('vendor/' + imp);
  });

  app.import('vendor/ember-orbit.js');
};

module.exports = EmberCLIEmberOrbit;
