import { camelize } from '@ember/string';
import { getOwner } from '@ember/application';
import { Schema, SchemaSettings } from '@orbit/data';
import modulesOfType from '../system/modules-of-type';

function getRegisteredModels(prefix, modelsCollection) {
  return modulesOfType(prefix, modelsCollection).map(camelize);
}

type SchemaInjections = { modelNames?: string[] } & SchemaSettings;

export default {
  create(injections: SchemaInjections = {}): Schema {
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

      for (const name of modelNames) {
        const { keys, attributes, relationships } = app.factoryFor(
          `${orbitConfig.types.model}:${name}`
        ).class;

        modelSchemas[name] = {
          keys,
          attributes,
          relationships
        };
      }

      injections.models = modelSchemas;
    }

    return new Schema(injections);
  }
};
