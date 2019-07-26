import { deepMerge } from '@orbit/utils';

export const DEFAULT_ORBIT_CONFIG = {
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
  skipStoreInjections: false,
  skipCoordinatorService: false,
  skipSchemaService: false,
  skipKeyMapService: false
};

export function initialize(application) {
  const envConfig = application.resolveRegistration('config:environment') || {};
  const config = deepMerge({}, DEFAULT_ORBIT_CONFIG, envConfig.orbit || {});

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
