import { Schema } from '@orbit/data';
import Ember from 'ember';

const { get, getOwner } = Ember;

/**
 * Retrieves models registered in the namespace of an Application or Engine.
 *
 * This resolution process is inefficient and should be revisited when the
 * Ember CLI Resolver v2 is introduced, since that should allow for more
 * targeted lookups by type via a pre-built map.
 */
function getRegisteredModels(prefix) {
  const regex = new RegExp('^' + prefix + '\/models\/?\/');
  const moduleNames = Object.keys(self.requirejs._eak_seen);
  var modelNames = [];

  moduleNames.forEach(moduleName => {
    var matches = regex.exec(moduleName);
    if (matches && matches.length === 1) {
      let modelName = moduleName.match(/[^\/]+\/?$/)[0];
      modelName = Ember.String.camelize(modelName);
      modelNames.push(modelName);
    }
  });

  return modelNames;
}

export default {
  create(injections = {}) {
    if (!injections.models) {
      const app = getOwner(injections);
      const modelSchemas = {};

      let modelNames = injections.modelNames || getRegisteredModels(app.base.modulePrefix);
      
      modelNames.forEach(name => {
        let model = app.factoryFor(`model:${name}`).class;
        modelSchemas[name] = {
          id: get(model, 'id'),
          keys: get(model, 'keys'),
          attributes: get(model, 'attributes'),
          relationships: get(model, 'relationships')
        };
      });

      injections.models = modelSchemas;
    }

    return new Schema(injections);
  }
}
