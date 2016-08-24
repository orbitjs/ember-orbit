/* eslint-env node */
/* eslint-disable new-cap */
'use strict';

var Funnel     = require('broccoli-funnel');
var MergeTrees = require('broccoli-merge-trees');
var path = require('path');

function packageSource(pkg, namespace) {
  return new Funnel(path.join(require.resolve(pkg), '..'), {
    include: ['**/*.js'],
    destDir: './' + (namespace || pkg)
  });
}

var modules = {
  symbolObservable: function() {
    var rxjsPath = path.join(require.resolve('rxjs-es'), '..');
    var symbolObservablePath = path.join(rxjsPath, 'node_modules', 'symbol-observable', 'es');
    return new Funnel(symbolObservablePath, {
      include: ['ponyfill.js'],
      destDir: '.',
      getDestinationPath: function() {
        return 'symbol-observable.js';
      }
    });
  },

  index: function() {
    return MergeTrees([
      packageSource('rxjs-es', 'rxjs'),
      packageSource('orbit-core', 'orbit'),
      packageSource('orbit-jsonapi'),
      packageSource('orbit-local-storage'),
      modules.symbolObservable()
    ]);
  }
};

module.exports = {
  name: 'ember-orbit',

  init: function() {
    this._super.init.apply(this, arguments);

    // Hack to set the vendor path to node_modules
    var assets_path = path.join('orbit-core','src','index.js');
    this.treePaths.vendor = require.resolve('orbit-core').replace(assets_path, '');
  },

  treeForAddon: function(tree) {
    var addonTree = this._super.treeForAddon.call(this, tree);

    return MergeTrees([
      addonTree,
      new Funnel(modules.index(), { destDir: './modules' })
    ]);
  },

  included: function(app) {
    app.import(path.join('vendor', 'immutable', 'dist', 'immutable.js'));

    return this._super.included(app);
  }
};
