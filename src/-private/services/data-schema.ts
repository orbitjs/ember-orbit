/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { orbitRegistry } from '../utils/orbit-registry.ts';
import { RecordSchema, type RecordSchemaSettings } from '@orbit/records';
import { camelize } from '@orbit/serializers';

function getRegisteredModels(): string[] {
  return Object.keys(orbitRegistry.registrations.models).map(camelize);
}

export type SchemaInjections = { modelNames?: string[] } & RecordSchemaSettings;

export default {
  create(injections: SchemaInjections = {}): RecordSchema {
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
        // @ts-expect-error TODO: fix these types
        const { keys, attributes, relationships } =
          orbitRegistry.registrations.models[name];

        injections.models[name] = {
          keys,
          attributes,
          relationships,
        };
      }
    }

    injections.version ??= orbitRegistry.schemaVersion;

    return new RecordSchema(injections);
  },
};
