var concat     = require('broccoli-sourcemap-concat');
var Funnel     = require('broccoli-funnel');
var mergeTrees = require('broccoli-merge-trees');
var compileES6 = require('broccoli-es6modules');
var compileES6Modules = require('broccoli-es6modules');
var transpileES6 = require('broccoli-babel-transpiler');
var jshintTree = require('broccoli-jshint');
var replace    = require('broccoli-string-replace');
var gitVersion = require('git-repo-version');

// extract version from git
// note: remove leading `v` (since by default our tags use a `v` prefix)
var version = gitVersion().replace(/^v/, '');

var packages = [
  {
    name: 'ember-orbit',
    include: [/ember-orbit.js/,
              /(ember-orbit\/.+.js)/]
  }
];

var loader = new Funnel('bower_components', {
  srcDir: 'loader',
  files: ['loader.js'],
  destDir: '/assets/'
});

var globalizedLoader = new Funnel('build-support', {
  srcDir: '/',
  files: ['globalized-loader.js'],
  destDir: '/assets/'
});

var generatedPackageConfigs = new Funnel('build-support', {
  srcDir: '/',
  destDir: '/',
  files: ['bower.json', 'package.json']
});

generatedPackageConfigs = replace(generatedPackageConfigs, {
  files: ['bower.json', 'package.json'],
  pattern: {
    match: /VERSION_PLACEHOLDER/,
    replacement: function() {
      return version;
    }
  }
});

var tests = new Funnel('test', {
  srcDir: '/tests',
  include: [/.js$/],
  destDir: '/tests'
});

var buildExtras = new Funnel('build-support', {
  srcDir: '/',
  destDir: '/',
  files: ['README.md', 'LICENSE']
});

var lib = {};
var main = {};
var globalized = {};

packages.forEach(function(package) {
  lib[package.name] = new Funnel('lib', {
    srcDir: '/',
    include: package.include,
    exclude: package.exclude || [],
    destDir: '/'
  });

  main[package.name] = mergeTrees([ lib[package.name] ]);
  main[package.name] = concat(new compileES6Modules(main[package.name]), {
    inputFiles: ['**/*.js'],
    outputFile: '/' + package.name + '.amd.js'
  });
  main[package.name] = new transpileES6(main[package.name]);

  var support = new Funnel('build-support', {
    srcDir: '/',
    files: ['iife-start.js', 'globalize-' + package.name + '.js', 'iife-stop.js'],
    destDir: '/'
  });

  var loaderTree = (package.name === 'orbit' ? loader : globalizedLoader);
  var loaderFile = (package.name === 'orbit' ? 'loader.js' : 'globalized-loader.js');

  globalized[package.name] = concat(mergeTrees([loaderTree, main[package.name], support]), {
    inputFiles: ['iife-start.js', 'assets/' + loaderFile, package.name + '.amd.js', 'globalize-' + package.name + '.js', 'iife-stop.js'],
    outputFile: '/' + package.name + '.js'
  });
});

var allLib = mergeTrees(Object.keys(lib).map(function(package) {
  return lib[package];
}));
var allMain = mergeTrees(Object.keys(main).map(function(package) {
  return main[package];
}));
var allGlobalized = mergeTrees(Object.keys(globalized).map(function(package) {
  return globalized[package];
}));

var jshintLib = jshintTree(allLib);
var jshintTest = jshintTree(tests);

var mainWithTests = mergeTrees([allLib, tests, jshintLib, jshintTest]);
var mainWithTests = new compileES6Modules(mainWithTests);
mainWithTests = new transpileES6(mainWithTests);
mainWithTests = concat(mainWithTests, {
  inputFiles: ['**/*.js'],
  outputFile: '/assets/tests.amd.js'
});

var vendor = concat('bower_components', {
  inputFiles: [
    'jquery/dist/jquery.js',
    'ember/ember-template-compiler.js',
    'ember/ember.debug.js',
    'orbit.js/orbit.amd.js',
    'orbit.js/orbit-common.amd.js',
    'orbit.js/orbit-common-jsonapi.amd.js',
    'orbit.js/orbit-common-local-storage.amd.js',
    'rxjs/dist/rx.all.js'],
  outputFile: '/assets/vendor.js'
});

var qunit = new Funnel('bower_components', {
  srcDir: '/qunit/qunit',
  files: ['qunit.js', 'qunit.css'],
  destDir: '/assets'
});

var testSupport = concat('test', {
  inputFiles: ['../test/test-support/sinon.js', '../test/test-support/test-shims.js', '../test/test-support/test-loader.js'],
  outputFile: '/assets/test-support.js'
});

var testIndex = new Funnel('test', {
  srcDir: '/',
  files: ['index.html'],
  destDir: '/tests'
});

module.exports = mergeTrees([loader, globalizedLoader, allMain,
  allGlobalized, mainWithTests, vendor, qunit, testSupport, testIndex,
  generatedPackageConfigs, buildExtras]);
