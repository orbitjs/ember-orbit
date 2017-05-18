import { Schema } from '@orbit/data';
import Ember from 'ember';
import modulesOfType from '../system/modules-of-type';

const { get, getOwner } = Ember;

function getRegisteredModels(prefix) {
  return modulesOfType(prefix, 'models').map(Ember.String.camelize);
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
