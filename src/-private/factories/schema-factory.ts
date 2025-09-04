/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { camelize } from '@orbit/serializers';
import { RecordSchema, type RecordSchemaSettings } from '@orbit/records';

import { orbitRegistry } from '../system/ember-orbit-setup.ts';

function getRegisteredModels(): string[] {
  return Object.keys(orbitRegistry.registrations.models).map(camelize);
}

type SchemaInjections = { modelNames?: string[] } & RecordSchemaSettings;

export default {
  create(injections: SchemaInjections = {}): RecordSchema {
    const orbitConfig = orbitRegistry.config;

    if (injections.models === undefined) {
      let modelNames: Array<string>;
      if (injections.modelNames) {
        modelNames = injections.modelNames;
        delete injections.modelNames;
      } else {
        modelNames = getRegisteredModels();
      }

      injections.models = {};
      for (const name of modelNames) {
        const { keys, attributes, relationships } =
          orbitRegistry.registrations.models[name];

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
