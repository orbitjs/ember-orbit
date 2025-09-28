import type Owner from '@ember/owner';
import DataSourceStore from '../../data-sources/store.ts';
import type MemorySourceFactory from '../factories/memory-source-factory.ts';
import type ModelFactory from '../model-factory.ts';
import { getName } from '../utils/get-name.ts';
import type { Strategy } from '@orbit/coordinator';
import type { Bucket } from '@orbit/core';
import type { Source } from '@orbit/data';
import { type MemorySourceSettings } from '@orbit/memory';

class OrbitRegistry {
  application: Owner | null = null;
  registrations: {
    buckets: Record<'main', Bucket>;
    models: Record<string, ModelFactory>;
    sources: Record<string, Source>;
    strategies: Record<string, Strategy>;
  } = {
    buckets: {} as Record<'main', Bucket>,
    models: {},
    sources: {},
    strategies: {},
  };
  schemaVersion?: number;
}

export const orbitRegistry = new OrbitRegistry();

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
  const folderConfig = {
    '/data-buckets/': { registry: orbitRegistry.registrations.buckets },
    '/data-models/': { registry: orbitRegistry.registrations.models },
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

      if (folder === '/data-models/') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        registry[name] =
          (module as FactoryForFolderType[typeof folder]).default ??
          (module as ModelFactory);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        registry[name] = (module as FactoryForFolderType[typeof folder]).default // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          ?.create?.({} as any);
      }
    }
  }

  // Register the store source after processing all modules
  orbitRegistry.registrations.sources['store'] = DataSourceStore.create(
    {} as MemorySourceSettings,
  );
}

export function setupOrbit(
  application: Owner,
  modules: Record<string, unknown>,
  config?: { schemaVersion?: number },
) {
  orbitRegistry.application = application;
  orbitRegistry.schemaVersion = config?.schemaVersion;
  injectModules(modules);
}
