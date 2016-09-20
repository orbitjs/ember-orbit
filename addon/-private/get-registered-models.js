import Ember from 'ember';

/**
 * Retrieves models registered in the namespace of an Application or Engine.
 *
 * This resolution process is inefficient and should be revisited when the
 * Ember CLI Resolver v2 is introduced, since that should allow for more
 * targeted lookups by type via a pre-built map.
 *
 * @function getRegisteredModels
 * @param  {Application} app Application or Engine which contains model modules.
 * @return {Array}           Array of camelized model names.
 */
export default function(app) {
  var prefix = app.modulePrefix;
  var regex = new RegExp('^' + prefix + '\/models\/?\/');
  var getKeys = (Object.keys || Ember.keys);
  var moduleNames = getKeys(self.requirejs._eak_seen);
  var models = [];

  for (var i = 0; i < moduleNames.length; i++) {
    var moduleName = moduleNames[i];
    var matches = regex.exec(moduleName);
    if (matches && matches.length === 1) {
      var model = moduleName.match(/[^\/]+\/?$/)[0];
      model = Ember.String.camelize(model);
      models.push(model);
    }
  }

  return models;
}
