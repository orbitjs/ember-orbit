import { camelize } from '@ember/string';
import { getOwner } from '@ember/application';
import {
  ModelDefinition,
  RecordSchema,
  RecordSchemaSettings
} from '@orbit/records';
import modulesOfType from '../system/modules-of-type';
import { Dict } from '@orbit/utils';

function getRegisteredModels(
  prefix: string,
  modelsCollection: string
): string[] {
  return modulesOfType(prefix, modelsCollection).map(camelize);
}

type SchemaInjections = { modelNames?: string[] } & RecordSchemaSettings;

export default {
  create(injections: SchemaInjections = {}): RecordSchema {
    if (!injections.models) {
      const app = getOwner(injections);
      const modelSchemas: Dict<ModelDefinition> = {};

      let orbitConfig = app.lookup('ember-orbit:config');
      let modelNames =
        injections.modelNames ??
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

    return new RecordSchema(injections);
  }
};
