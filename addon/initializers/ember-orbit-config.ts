import { deepMerge } from '@orbit/utils';
import Application from '@ember/application';

export interface OrbitConfig {
  types: {
    bucket: string;
    model: string;
    source: string;
    strategy: string;
  };
  collections: {
    buckets: string;
    models: string;
    sources: string;
    strategies: string;
  };
  services: {
    store: string;
    coordinator: string;
    schema: string;
    keyMap: string;
  };
  skipStoreService: boolean;
  skipCoordinatorService: boolean;
  skipSchemaService: boolean;
  skipKeyMapService: boolean;
  mutableModels: boolean;
}

export const DEFAULT_ORBIT_CONFIG: OrbitConfig = {
  types: {
    bucket: 'data-bucket',
    model: 'data-model',
    source: 'data-source',
    strategy: 'data-strategy'
  },
  collections: {
    buckets: 'data-buckets',
    models: 'data-models',
    sources: 'data-sources',
    strategies: 'data-strategies'
  },
  services: {
    store: 'store',
    coordinator: 'data-coordinator',
    schema: 'data-schema',
    keyMap: 'data-key-map'
  },
  skipStoreService: false,
  skipCoordinatorService: false,
  skipSchemaService: false,
  skipKeyMapService: false,
  mutableModels: false
};

interface ApplicationRegistry {
  __registry__: any;
}

export function initialize(application: Application & ApplicationRegistry) {
  const envConfig = application.resolveRegistration('config:environment') ?? {};
  const config = deepMerge({}, DEFAULT_ORBIT_CONFIG, envConfig.orbit ?? {});

  // Customize pluralization rules
  if (
    application.__registry__ &&
    application.__registry__.resolver &&
    application.__registry__.resolver.pluralizedTypes
  ) {
    application.__registry__.resolver.pluralizedTypes[config.types.bucket] =
      config.collections.buckets;
    application.__registry__.resolver.pluralizedTypes[config.types.model] =
      config.collections.models;
    application.__registry__.resolver.pluralizedTypes[config.types.source] =
      config.collections.sources;
    application.__registry__.resolver.pluralizedTypes[config.types.strategy] =
      config.collections.strategies;
  }

  application.register('ember-orbit:config', config, {
    instantiate: false
  });
}

export default {
  name: 'ember-orbit-config',
  initialize
};
