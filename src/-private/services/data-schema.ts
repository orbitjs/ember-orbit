/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { getOwner } from '@ember/-internals/owner';
import type Owner from '@ember/owner';
import { getOrbitRegistry } from '../utils/orbit-registry.ts';
import { RecordSchema, type RecordSchemaSettings } from '@orbit/records';

export type SchemaInjections = { modelNames?: string[] } & RecordSchemaSettings;

export default {
  create(injections: SchemaInjections = {}): RecordSchema {
    const owner = getOwner(injections) as Owner;
    const orbitRegistry = getOrbitRegistry(owner);

    if (injections.models === undefined) {
      let modelNames: Array<string>;
      if (injections.modelNames) {
        modelNames = injections.modelNames;
        delete injections.modelNames;
      } else {
        modelNames = orbitRegistry.getRegisteredModels();
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
