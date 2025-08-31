/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { camelize } from '@orbit/serializers';
import { getOwner } from '@ember/application';
import { RecordSchema, type RecordSchemaSettings } from '@orbit/records';

import type ApplicationInstance from '@ember/application/instance';
import type { OrbitConfig } from '../../instance-initializers/ember-orbit-config.ts';
import { orbitModuleRegistry } from '../system/ember-orbit-setup.ts';

function getRegisteredModels(): string[] {
  return Object.keys(orbitModuleRegistry.registrations.models).map(camelize);
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
        modelNames = getRegisteredModels();
      }

      injections.models = {};
      for (const name of modelNames) {
        const { keys, attributes, relationships } =
          orbitModuleRegistry.registrations.models[name];

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
