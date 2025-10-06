import DataSourceStore from '../../data-sources/store.ts';
// Import service factories
import DataCoordinator from '../../services/data-coordinator.ts';
import DataKeyMap from '../../services/data-key-map.ts';
import DataNormalizer from '../../services/data-normalizer.ts';
import DataSchema from '../../services/data-schema.ts';
import DataValidator from '../../services/data-validator.ts';
import Store from '../../services/store.ts';
import type MemorySourceFactory from '../factories/memory-source-factory.ts';
import type ModelFactory from '../model-factory.ts';
import { getName } from '../utils/get-name.ts';
import { orbitRegistry } from '../utils/orbit-registry.ts';
import type { Strategy } from '@orbit/coordinator';
import type { Bucket } from '@orbit/core';
import { type MemorySourceSettings } from '@orbit/memory';

type Folder =
  | '/data-buckets/'
  | '/data-models/'
  | '/data-sources/'
  | '/data-strategies/';

interface FactoryForFolderType {
  '/data-buckets/': { default: { create(): Bucket } };
  '/data-models/': { default: ModelFactory };
  '/data-sources/': { default: typeof MemorySourceFactory };
  '/data-strategies/': { default: { create(): Strategy } };
}

function injectModules(modules: Record<string, unknown>) {
  // First register models (they don't need services)
  const modelMatches = Object.entries(modules).filter(([key]) =>
    key.includes('/data-models/'),
  );

  for (const [key, module] of modelMatches) {
    let [, name] = key.split('/data-models/');
    name = getName(name as string);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    orbitRegistry.registrations.models[name] =
      (module as FactoryForFolderType['/data-models/']).default ??
      (module as ModelFactory);
  }
}

function injectSourcesAndStrategies(modules: Record<string, unknown>) {
  const folderConfig = {
    '/data-buckets/': { registry: orbitRegistry.registrations.buckets },
    '/data-sources/': { registry: orbitRegistry.registrations.sources },
    '/data-strategies/': { registry: orbitRegistry.registrations.strategies },
  };

  for (const [folder, { registry }] of Object.entries(folderConfig) as [
    Folder,
    { registry: any },
  ][]) {
    const matches = Object.entries(modules).filter(([key]) =>
      key.includes(folder),
    );

    if (folder === '/data-buckets/' && matches.length > 1) {
      throw new Error(
        `Expected only one file under /data-buckets/, found ${matches.length}: ` +
          matches.map(([key]) => key).join(', '),
      );
    }

    for (const [key, module] of matches) {
      if (folder === '/data-buckets/') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        registry['main'] = (
          module as FactoryForFolderType['/data-buckets/']
        ).default?.create?.();
        continue;
      }

      let [, name] = key.split(folder);
      name = getName(name as string);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      registry[name] = (module as FactoryForFolderType[typeof folder]).default // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        ?.create?.({} as any);
    }
  }

  // Register the store source after processing all modules
  orbitRegistry.registrations.sources['store'] = DataSourceStore.create(
    {} as MemorySourceSettings,
  );
}

export function setupOrbit(
  modules: Record<string, unknown>,
  config?: { schemaVersion?: number },
) {
  orbitRegistry.schemaVersion = config?.schemaVersion;

  // First create only services that truly have no dependencies
  orbitRegistry.registrations.services['data-key-map'] = DataKeyMap.create();
  orbitRegistry.registrations.services['data-validator'] = DataValidator.create(
    {},
  );

  // Register models first (needed for schema)
  injectModules(modules);

  // Create schema service (needs models)
  orbitRegistry.registrations.services['data-schema'] = DataSchema.create({});

  // Create sources, buckets, strategies (need schema)
  injectSourcesAndStrategies(modules);

  // Finally create services that depend on sources
  orbitRegistry.registrations.services['data-normalizer'] =
    DataNormalizer.create({} as any);
  orbitRegistry.registrations.services['data-coordinator'] =
    DataCoordinator.create({});
  orbitRegistry.registrations.services['store'] = Store.create({} as any);
}
