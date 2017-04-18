/* eslint-env node */
/* eslint-disable new-cap */
'use strict';

const funnel     = require('broccoli-funnel');
const mergeTrees = require('broccoli-merge-trees');
const path       = require('path');
const resolve    = require('resolve');

function packageTree(name, options = {}) {
  let namespace = options.namespace || name;

  let packagePath = path.join(name, 'package');
  let packageJson = require(packagePath);
  let packageDir = path.dirname(require.resolve(packagePath));

  // For now, we're simply importing ES5 AMD output, which is assumed to be in the path `dist/amd/es5`
  // (this is the standard output path from @glimmer/build, which is used to build all orbit packages).
  // 
  // However, this is very inflexible and should be converted to use the 
  // `module` property from package.json, with fallbacks such as:
  //
  // packageJson['module'] || packageJson['jsnext:main'] || packageJson['main'].replace(/dist\//, 'dist/es6/');
  //
  // Unfortunately, it's currently unclear (to me) how to best merge 
  // non-transpiled output with the addon's tree, while maintaining unique 
  // namespaces for each dependency.
  let entryModule = 'dist/amd/es5/';

  return funnel(path.join(packageDir, entryModule), {
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
      funnel(mergeTrees(packageTrees), { destDir: './modules' })
    ]);
  }
};
