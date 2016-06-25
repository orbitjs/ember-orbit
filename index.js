/* eslint-env node */
/* eslint-disable new-cap */
'use strict';

var Funnel     = require('broccoli-funnel');
var MergeTrees = require('broccoli-merge-trees');
var path = require('path');
var replace = require('broccoli-replace');

var modules = {
  orbit: function() {
    var orbitSrc = path.join(require.resolve('orbit.js'), '..', 'src');
    var orbit = new Funnel(orbitSrc, {
      include: ['orbit.js', 'orbit-common.js', 'orbit/**/*', 'orbit-common/**/*'],
      destDir: '.'
    });

    return orbit;
  },

  rxjs: function() {
    var rxjsSource = path.join(require.resolve('rxjs-es'), '..');
    var original = new Funnel(rxjsSource, {
      include: ['**/*.js'],
      destDir: './rxjs'
    });

    var withAsyncFix = replace(original, {
      files: [
        'rxjs/Rx.DOM.js',
        'rxjs/Rx.js'
      ],
      patterns: [
        { match: /async,/, replace: 'async: async,' }
      ]
    });

    return withAsyncFix;
  },

  symbolObservable: function() {
    var symbolObservableSource = path.join(require.resolve('symbol-observable'), '..');
    var symbolObservable = new Funnel(symbolObservableSource, {
      include: ['ponyfill.js'],
      destDir: '.',
      getDestinationPath: function() {
        return 'symbol-observable.js';
      }
    });

    // Need an AMD-compatible export
    // See https://github.com/ReactiveX/rxjs/issues/1664
    var withExportFix = replace(symbolObservable, {
      files: [
        'symbol-observable.js'
      ],
      patterns: [
        { match: /module\.exports/, replace: 'exports[\'default\']' }
      ]
    });

    return withExportFix;
  },

  index: function() {
    return MergeTrees([
      modules.rxjs(),
      modules.orbit(),
      modules.symbolObservable()
    ]);
  }
};

module.exports = {
  name: 'ember-orbit',

  init: function() {
    this._super.init.apply(this, arguments);
    
    // Hack to set the vendor path to node_modules
    var assets_path = require('path').join('immutable','dist','immutable.js');
    this.treePaths.vendor = require.resolve('immutable').replace(assets_path, '');
  },

  treeForAddon: function(tree) {
    var addonTree = this._super.treeForAddon.call(this, tree);

    return MergeTrees([
      addonTree,
      new Funnel(modules.index(), { destDir: './modules' })
    ]);
  },

  included: function(app) {
    app.import('vendor/immutable/dist/immutable.min.js');

    return this._super.included(app);
  }
};
