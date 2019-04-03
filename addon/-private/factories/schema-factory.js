import { camelize } from '@ember/string';
import { get } from '@ember/object';
import { getOwner } from '@ember/application';
import { Schema } from '@orbit/data';
import modulesOfType from '../system/modules-of-type';

function getRegisteredModels(prefix, modelsCollection) {
  return modulesOfType(prefix, modelsCollection).map(camelize);
}

export default {
  create(injections = {}) {
    if (!injections.models) {
      const app = getOwner(injections);
      const modelSchemas = {};

      let orbitConfig = app.lookup('ember-orbit:config');
      let modelNames = injections.modelNames || getRegisteredModels(app.base.modulePrefix, orbitConfig.collections.models);

      modelNames.forEach(name => {
        let model = app.factoryFor(`${orbitConfig.types.model}:${name}`).class;
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
