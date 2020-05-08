import { camelize } from '@ember/string';
import { getOwner } from '@ember/application';
import { Schema } from '@orbit/data';
import modulesOfType from '../system/modules-of-type';
import { singularize, pluralize } from 'ember-inflector';

function getRegisteredModels(prefix, modelsCollection) {
  return modulesOfType(prefix, modelsCollection).map(camelize);
}

export default {
  create(injections = {}) {
    if (!injections.models) {
      const app = getOwner(injections);
      const modelSchemas = {};

      let orbitConfig = app.lookup('ember-orbit:config');
      let modelNames =
        injections.modelNames ||
        getRegisteredModels(
          app.base.modulePrefix,
          orbitConfig.collections.models
        );

      modelNames.forEach((name) => {
        let model = app.factoryFor(`${orbitConfig.types.model}:${name}`).class;
        modelSchemas[name] = {
          keys: model.keys,
          attributes: model.attributes,
          relationships: model.relationships
        };
      });

      injections.models = modelSchemas;
    }

    if (!injections.pluralize) {
      injections.pluralize = pluralize;
    }

    if (!injections.singularize) {
      injections.singularize = singularize;
    }

    return new Schema(injections);
  }
};
