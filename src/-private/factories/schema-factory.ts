/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { camelize } from '@orbit/serializers';
import { getOwner } from '@ember/application';
import { RecordSchema, type RecordSchemaSettings } from '@orbit/records';
import modulesOfType from '../system/modules-of-type.ts';
import type ApplicationInstance from '@ember/application/instance';
import type { OrbitConfig } from '../../instance-initializers/ember-orbit-config.ts';

function getRegisteredModels(
  prefix: string,
  modelsCollection: string,
): string[] {
  return modulesOfType(prefix, modelsCollection).map(camelize);
}

type SchemaInjections = { modelNames?: string[] } & RecordSchemaSettings;

export default {
  create(injections: SchemaInjections = {}): RecordSchema {
    const app = getOwner(injections) as ApplicationInstance;
    const orbitConfig = app.lookup('ember-orbit:config') as OrbitConfig;

    if (injections.models === undefined) {
      let modelNames: Array<string>;
      if (injections.modelNames) {
        modelNames = injections.modelNames;
        delete injections.modelNames;
      } else {
        modelNames =
          (app.lookup('ember-orbit:model-names') as Array<string>) ??
          getRegisteredModels(
            // @ts-expect-error TODO: fix this type error
            app.base.modulePrefix as string,
            orbitConfig.collections.models,
          );
      }

      injections.models = {};
      for (const name of modelNames) {
        // @ts-expect-error TODO: fix this type error
        const { keys, attributes, relationships } = app.factoryFor(
          `${orbitConfig.types.model}:${name}`,
        )!.class;

        injections.models[name] = {
          keys,
          attributes,
          relationships,
        };
      }
    }

    // @ts-expect-error TODO: fix this type error
    injections.version ??= orbitConfig.schemaVersion;

    return new RecordSchema(injections);
  },
};
