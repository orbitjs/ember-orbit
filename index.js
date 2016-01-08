/* jshint node: true */
'use strict';
module.exports = {
  name: 'ember-orbit',

  included: function(app) {
    this._super.included(app);

    app.import('bower_components/orbit.js/orbit.amd.js');
    app.import('bower_components/orbit.js/orbit-common.amd.js');
    app.import('bower_components/orbit.js/orbit-common-jsonapi.amd.js');
    app.import('bower_components/orbit.js/orbit-common-local-storage.amd.js');
    app.import('bower_components/rxjs/dist/rx.all.js');
  }
};
