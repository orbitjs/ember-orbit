/* eslint-env node */
/* eslint-disable new-cap */
'use strict';

const Funnel     = require('broccoli-funnel');
const mergeTrees = require('broccoli-merge-trees');
const path       = require('path');
const resolve    = require('resolve');

function packageTree(name, _options) {
  let options = _options || {};
  let namespace = options.namespace || name;

  let packagePath = path.join(name, 'package');
  let packageJson = require(packagePath);
  let packageDir = path.dirname(require.resolve(packagePath));
  let entryModule = packageJson['module'] || packageJson['jsnext:main'] || packageJson['main'].replace(/dist\//, 'dist/es6/');

  return new Funnel(path.join(packageDir, entryModule, '..'), {
    include: ['**/*.js'],
    destDir: './' + namespace
  });
}

module.exports = {
  name: 'ember-orbit',

  treeForAddon: function(tree) {
    let addonTree = this._super.treeForAddon.call(this, tree);

    let packageTrees = [
      packageTree('@orbit/utils'),
      packageTree('@orbit/core'),
      packageTree('@orbit/data'),
      packageTree('@orbit/store')
    ];

    let host = this.app || this.parent;
    let orbitOptions = host.options && host.options.orbit;
    let orbitSources = orbitOptions && orbitOptions.packages;

    if (orbitSources) {
      orbitSources.forEach(source => {
        let sourceTree = packageTree(source);
        packageTrees.push(sourceTree);
      });
    }

    return mergeTrees([
      addonTree,
      new Funnel(mergeTrees(packageTrees), { destDir: './modules' })
    ]);
  }
};
