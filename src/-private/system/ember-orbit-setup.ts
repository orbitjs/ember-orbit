import DataSourceStore from '../../data-sources/store.ts';
import type MemorySourceFactory from '../factories/memory-source-factory.ts';
import type ModelFactory from '../model-factory.ts';
import DataCoordinator from '../services/data-coordinator.ts';
import DataKeyMap from '../services/data-key-map.ts';
import DataNormalizer from '../services/data-normalizer.ts';
import DataSchema from '../services/data-schema.ts';
import DataValidator from '../services/data-validator.ts';
import StoreService from '../services/store.ts';
import type { StoreSettings } from '../store.ts';
import { getName } from '../utils/get-name.ts';
import { orbitRegistry } from '../utils/orbit-registry.ts';
import type { Strategy } from '@orbit/coordinator';
import type { Bucket } from '@orbit/core';
import { type MemorySourceSettings } from '@orbit/memory';

interface FactoryForFolderType {
  '/data-buckets/': { default: { create(): Bucket } };
  '/data-models/': { default: ModelFactory };
  '/data-sources/': { default: typeof MemorySourceFactory };
  '/data-strategies/': { default: { create(): Strategy } };
}

function injectDataBuckets(modules: Record<string, unknown>) {
  const registry = orbitRegistry.registrations.buckets;
  const matches = Object.entries(modules);

  if (matches.length > 1) {
    throw new Error(
      `Expected only one file under /data-buckets/, found ${matches.length}: ` +
        matches.map(([key]) => key).join(', '),
    );
  }

  for (const [, module] of matches) {
    registry['main'] = (
      module as FactoryForFolderType['/data-buckets/']
    ).default?.create?.();
  }
}

function injectDataModels(modules: Record<string, unknown>) {
  const folder = '/data-models/';
  const registry = orbitRegistry.registrations.models;

  for (const [key, module] of Object.entries(modules)) {
    let [, name] = key.split(folder);
    name = getName(name as string);

    registry[name] =
      (module as FactoryForFolderType['/data-models/']).default ??
      (module as ModelFactory);
  }
}

function injectDataSources(modules: Record<string, unknown>) {
  const folder = '/data-sources/';
  const registry = orbitRegistry.registrations.sources;

  for (const [key, module] of Object.entries(modules)) {
    let [, name] = key.split(folder);
    name = getName(name as string);

    registry[name] = (module as FactoryForFolderType['/data-sources/']).default // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      ?.create?.({} as any);
  }
}

function injectDataStrategies(modules: Record<string, unknown>) {
  const folder = '/data-strategies/';
  const registry = orbitRegistry.registrations.strategies;

  for (const [key, module] of Object.entries(modules)) {
    let [, name] = key.split(folder);
    name = getName(name as string);

    registry[name] = (
      module as FactoryForFolderType['/data-strategies/']
    ).default?.create?.();
  }
}

function injectModules(modules: Record<string, unknown>) {
  const bucketModules: Record<string, unknown> = {};
  const modelModules: Record<string, unknown> = {};
  const sourceModules: Record<string, unknown> = {};
  const strategyModules: Record<string, unknown> = {};

  for (const [key, module] of Object.entries(modules)) {
    if (key.includes('/data-buckets/')) {
      bucketModules[key] = module;
    } else if (key.includes('/data-models/')) {
      modelModules[key] = module;
    } else if (key.includes('/data-sources/')) {
      sourceModules[key] = module;
    } else if (key.includes('/data-strategies/')) {
      strategyModules[key] = module;
    }
  }

  injectDataBuckets(bucketModules);
  injectDataModels(modelModules);
  injectServices();
  injectDataSources(sourceModules);
  injectDataStrategies(strategyModules);
}

function injectServices() {
  const keyMap = DataKeyMap.create();
  const schema = DataSchema.create();
  orbitRegistry.services.keyMap = keyMap;
  orbitRegistry.services.schema = schema;
  orbitRegistry.services.normalizer = DataNormalizer.create({
    keyMap,
    schema,
  });
  orbitRegistry.services.validatorFor = DataValidator.create({
    validators: {},
  });
  orbitRegistry.services.dataCoordinator = DataCoordinator.create();
  orbitRegistry.services.store = StoreService.create({} as StoreSettings);
}

export function setupOrbit(
  modules: Record<string, unknown>,
  config?: { schemaVersion?: number },
) {
  orbitRegistry.schemaVersion = config?.schemaVersion;
  injectModules(modules);
  // Register the store source after processing all modules
  orbitRegistry.registrations.sources['store'] = DataSourceStore.create(
    {} as MemorySourceSettings,
  );
}
