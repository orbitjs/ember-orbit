/* eslint-env node */
/* eslint-disable new-cap */
'use strict';

var Funnel     = require('broccoli-funnel');
var mergeTrees = require('broccoli-merge-trees');
var path       = require('path');
var resolve    = require('resolve');

function packageTree(name, _options) {
  var options = _options || {};
  var namespace = options.namespace || name;
  var resolveOptions = options.resolveOptions || {};

  // console.log('packageTree:', name, resolve.sync(name, resolveOptions));

  return new Funnel(path.join(resolve.sync(name, resolveOptions), '..'), {
    include: ['**/*.js'],
    destDir: './' + namespace
  });
}

function symbolObservableTree() {
  var rxjsPath = path.join(require.resolve('rxjs-es'), '..');
  var symbolObservablePath = path.join(rxjsPath, 'node_modules', 'symbol-observable', 'es');
  return new Funnel(symbolObservablePath, {
    include: ['ponyfill.js'],
    destDir: '.',
    getDestinationPath: function() {
      return 'symbol-observable.js';
    }
  });
}

module.exports = {
  name: 'ember-orbit',

  init: function() {
    this._super.init.apply(this, arguments);

    // Hack to set the vendor path to node_modules so that immutable.js can be
    // included directly (see `included` method below)
    var assets_path = path.join('immutable','dist','immutable.js');
    this.treePaths.vendor = require.resolve('immutable').replace(assets_path, '');

    // console.log('vendor:', this.treePaths.vendor);
  },

  treeForAddon: function(tree) {
    var addonTree = this._super.treeForAddon.call(this, tree);

    var packageTrees = [
      packageTree('rxjs-es', { namespace: 'rxjs' }),
      symbolObservableTree(),
      packageTree('orbit-core', { namespace: 'orbit' }),
      packageTree('orbit-store')
    ];

    var host = this.app || this.parent;
    var orbitOptions = host.options && host.options.orbit;
    var orbitSources = orbitOptions && orbitOptions.sources;

    if (orbitSources) {
      orbitSources.forEach(function(source) {
        var sourceTree = packageTree(source, { resolveOptions: { basedir: this.parent.root } });
        packageTrees.push(sourceTree);
      }, this);
    }

    return mergeTrees([
      addonTree,
      new Funnel(mergeTrees(packageTrees), { destDir: './modules' })
    ]);
  },

  included: function(app) {
    app.import(path.join('vendor', 'immutable', 'dist', 'immutable.js'));

    return this._super.included(app);
  }
};
