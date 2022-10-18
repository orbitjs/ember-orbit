import { camelize } from '@orbit/serializers';
import { getOwner } from '@ember/application';
import { RecordSchema, RecordSchemaSettings } from '@orbit/records';
import modulesOfType from '../system/modules-of-type';

function getRegisteredModels(
  prefix: string,
  modelsCollection: string
): string[] {
  return modulesOfType(prefix, modelsCollection).map(camelize);
}

type SchemaInjections = { modelNames?: string[] } & RecordSchemaSettings;

export default {
  create(injections: SchemaInjections = {}): RecordSchema {
    const app = getOwner(injections);
    const orbitConfig = app?.lookup('ember-orbit:config');

    if (injections.models === undefined) {
      let modelNames;
      if (injections.modelNames) {
        modelNames = injections.modelNames;
        delete injections.modelNames;
      } else {
        modelNames =
          app?.lookup('ember-orbit:model-names') ??
          getRegisteredModels(
            app.base.modulePrefix,
            orbitConfig.collections.models
          );
      }

      injections.models = {};
      for (const name of modelNames) {
        const { keys, attributes, relationships } = app?.factoryFor(
          `${orbitConfig.types.model}:${name}`
        ).class;

        injections.models[name] = {
          keys,
          attributes,
          relationships
        };
      }
    }

    injections.version ??= orbitConfig.schemaVersion;

    return new RecordSchema(injections);
  }
};
