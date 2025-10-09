import type Owner from '@ember/owner';
import { setOwner } from '@ember/owner';
import DataSourceStore from '../../data-sources/store.ts';
import type MemorySourceFactory from '../factories/memory-source-factory.ts';
import type ModelFactory from '../model-factory.ts';
import DataCoordinator, {
  type CoordinatorInjections,
} from '../services/data-coordinator.ts';
import DataKeyMap from '../services/data-key-map.ts';
import DataNormalizer from '../services/data-normalizer.ts';
import DataSchema, { type SchemaInjections } from '../services/data-schema.ts';
import DataValidator from '../services/data-validator.ts';
import StoreService from '../services/store.ts';
import type { StoreSettings } from '../store.ts';
import { getName } from '../utils/get-name.ts';
import { orbitRegistry } from '../utils/orbit-registry.ts';
import type { Strategy } from '@orbit/coordinator';
import type { Bucket } from '@orbit/core';
import { type MemorySourceSettings } from '@orbit/memory';

interface FactoryForFolderType {
  '/data-buckets/': { default: { create(injections: object): Bucket } };
  '/data-models/': { default: ModelFactory };
  '/data-sources/': { default: typeof MemorySourceFactory };
  '/data-strategies/': { default: { create(): Strategy } };
}

function registerDataBuckets(owner: Owner, modules: Record<string, unknown>) {
  const registry = orbitRegistry.registrations.buckets;
  const matches = Object.entries(modules);

  if (matches.length > 1) {
    throw new Error(
      `Expected only one file under /data-buckets/, found ${matches.length}: ` +
        matches.map(([key]) => key).join(', '),
    );
  }

  for (const [, module] of matches) {
    const bucketSettings = {};

    setOwner(bucketSettings, owner);

    registry['main'] = (
      module as FactoryForFolderType['/data-buckets/']
    ).default?.create?.(bucketSettings);
  }
}

function registerDataModels(modules: Record<string, unknown>) {
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

function registerDataSources(owner: Owner, modules: Record<string, unknown>) {
  const folder = '/data-sources/';
  const registry = orbitRegistry.registrations.sources;

  for (const [key, module] of Object.entries(modules)) {
    let [, name] = key.split(folder);
    name = getName(name as string);

    const sourceSettings = {} as MemorySourceSettings;

    setOwner(sourceSettings, owner);

    registry[name] = (module as FactoryForFolderType['/data-sources/']).default // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      ?.create?.({} as MemorySourceSettings);
  }
}

function registerDataStrategies(modules: Record<string, unknown>) {
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

/**
 * Registers the "injectable" services needed to inject into
 * the `injections` of all the other things.
 */
function registerInjectableServices(owner: Owner) {
  const keyMap = DataKeyMap.create();
  orbitRegistry.services.dataKeyMap = keyMap;

  const schemaSettings = {} as SchemaInjections;
  setOwner(schemaSettings, owner);
  const schema = DataSchema.create(schemaSettings);
  orbitRegistry.services.dataSchema = schema;

  const normalizerSettings = {
    keyMap,
    schema,
  };
  setOwner(normalizerSettings, owner);
  orbitRegistry.services.dataNormalizer =
    DataNormalizer.create(normalizerSettings);

  const validatorSettings = {
    validators: {},
  };
  setOwner(validatorSettings, owner);
  orbitRegistry.services.dataValidator =
    DataValidator.create(validatorSettings);
}

function registerModules(owner: Owner, modules: Record<string, unknown>) {
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
  // Create buckets and models first because they do not need anything injected.
  registerDataBuckets(owner, bucketModules);
  registerDataModels(modelModules);
  // Register the services we need to inject into all the other things.
  registerInjectableServices(owner);
  // Then register the sources themselves
  registerDataSources(owner, sourceModules);
  registerDataStrategies(strategyModules);
  // Register the store source after registering all modules
  orbitRegistry.registrations.sources['store'] = DataSourceStore.create(
    {} as MemorySourceSettings,
  );
  const storeSettings = {} as StoreSettings;
  setOwner(storeSettings, owner);
  orbitRegistry.services.store = StoreService.create(storeSettings);

  const coordinatorSettings = {} as CoordinatorInjections;
  setOwner(coordinatorSettings, owner);
  // IMPORTANT: Do not move this. The coordinator always needs to be registed last.
  orbitRegistry.services.dataCoordinator =
    DataCoordinator.create(coordinatorSettings);
}

export function setupOrbit(
  owner: Owner,
  modules: Record<string, unknown>,
  config?: { schemaVersion?: number },
) {
  orbitRegistry.schemaVersion = config?.schemaVersion;
  registerModules(owner, modules);
}
