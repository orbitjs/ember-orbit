/* eslint-env node */
/* eslint-disable new-cap */
'use strict';

const funnel     = require('broccoli-funnel');
const mergeTrees = require('broccoli-merge-trees');
const path       = require('path');
const resolve    = require('resolve');

function findLib(name, libPath) {
  let packagePath = path.join(name, 'package');
  let packageRoot = path.dirname(require.resolve(packagePath));

  libPath = libPath || getLibPath(packagePath);

  return path.resolve(packageRoot, libPath);
};

function getLibPath(packagePath) {
  let packageJson = require(packagePath);

  return path.dirname(packageJson['module'] || packageJson['main'] || '.');
}

function packageTree(name, destDir) {
  let libPath = findLib(name);

  destDir = destDir || path.join.apply(this, name.split('/'));

  let tree = funnel(libPath, {
    include: ['**/*.js'],
    destDir
  });

  return tree;
}

module.exports = {
  name: 'ember-orbit',

  treeForAddon(tree) {
    let packageTrees = [
      packageTree('@orbit/utils'),
      packageTree('@orbit/core'),
      packageTree('@orbit/data'),
      packageTree('@orbit/store'),
      packageTree('@orbit/coordinator')
    ];

    let host = this.app || this.parent;
    let orbitOptions = host.options && host.options.orbit;
    let customPackages = orbitOptions && orbitOptions.packages;

    if (customPackages) {
      customPackages.forEach(source => {
        packageTrees.push(packageTree(source));
      });
    }

    let addonTree = this._super.treeForAddon.call(this, tree);
    
    let babel = this.addons.find(addon => addon.name === 'ember-cli-babel');
    let transpiledPackageTrees = packageTrees.map(tree => babel.transpileTree(tree));

    let mergedPackageTree = funnel(mergeTrees(transpiledPackageTrees), {
      destDir: 'modules'
    });

    return mergeTrees([mergedPackageTree, addonTree]);
  }
};