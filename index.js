/* jshint node: true */
'use strict';

var Funnel     = require('broccoli-funnel');
var MergeTrees = require('broccoli-merge-trees');
var path = require('path');

module.exports = {
  name: 'ember-orbit',

  treeForAddon: function(tree) {
    var addonTree = this._super.treeForAddon.call(this, tree);

    var orbitSrc = path.join(require.resolve('orbit.js'), '..', 'lib');
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
  }
};
