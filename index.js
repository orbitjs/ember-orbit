/* jshint node: true */
'use strict';

var Funnel     = require('broccoli-funnel');
var MergeTrees = require('broccoli-merge-trees');
var path = require('path');

module.exports = {
  name: 'ember-orbit',

  init: function(name) {
    // Hack to set the vendor path to node_modules
    var assets_path = require('path').join('immutable','dist','immutable.js');
    this.treePaths['vendor'] = require.resolve('immutable').replace(assets_path, '');
  },

  treeForAddon: function(tree) {
    var addonTree = this._super.treeForAddon.call(this, tree);

    var orbitSrc = path.join(require.resolve('orbit.js'), '..', 'src');
    var orbit = new Funnel(orbitSrc, {
      include: ['orbit.js', 'orbit-common.js', 'orbit/**/*', 'orbit-common/**/*'],
      destDir: './modules'
    });

    var rxjsSource = path.join(require.resolve('rxjs-es'), '..');
    var rxjs = new Funnel(rxjsSource, {
      include: ['**/*.js'],
      destDir: './modules/rxjs'
    });

    tree = MergeTrees([addonTree, rxjs, orbit]);

    return tree;
  },

  included: function(app) {
    this._super.included(app);

    app.import('vendor/immutable/dist/immutable.min.js');
  }
};
