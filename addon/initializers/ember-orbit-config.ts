import { deepMerge } from '@orbit/utils';
import type ApplicationInstance from '@ember/application/instance';

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
    bucket: string;
    coordinator: string;
    schema: string;
    keyMap: string;
    normalizer: string;
    validator: string;
  };
  skipStoreService: boolean;
  skipBucketService: boolean;
  skipCoordinatorService: boolean;
  skipSchemaService: boolean;
  skipKeyMapService: boolean;
  skipNormalizerService: boolean;
  skipValidatorService: boolean;
}

export const DEFAULT_ORBIT_CONFIG: OrbitConfig = {
  types: {
    bucket: 'data-bucket',
    model: 'data-model',
    source: 'data-source',
    strategy: 'data-strategy',
  },
  collections: {
    buckets: 'data-buckets',
    models: 'data-models',
    sources: 'data-sources',
    strategies: 'data-strategies',
  },
  services: {
    store: 'store',
    bucket: 'data-bucket',
    coordinator: 'data-coordinator',
    schema: 'data-schema',
    keyMap: 'data-key-map',
    normalizer: 'data-normalizer',
    validator: 'data-validator',
  },
  skipStoreService: false,
  skipBucketService: false,
  skipCoordinatorService: false,
  skipSchemaService: false,
  skipKeyMapService: false,
  skipNormalizerService: false,
  skipValidatorService: false,
};

export function initialize(application: ApplicationInstance) {
  const envConfig = application.resolveRegistration('config:environment') ?? {};

  const config = deepMerge(
    {},
    DEFAULT_ORBIT_CONFIG,
    // @ts-expect-error TODO: fix this type error
    envConfig.orbit ?? {}
  ) as OrbitConfig;

  // Customize pluralization rules

  const pluralizedTypes = // @ts-expect-error TODO: fix this type error
    application.__registry__?.resolver?.pluralizedTypes as
      | Record<string, string>
      | undefined;
  if (pluralizedTypes) {
    pluralizedTypes[config.types.bucket] = config.collections.buckets;
    pluralizedTypes[config.types.model] = config.collections.models;
    pluralizedTypes[config.types.source] = config.collections.sources;
    pluralizedTypes[config.types.strategy] = config.collections.strategies;
  }

  application.register('ember-orbit:config', config, {
    instantiate: false,
  });
}

export default {
  name: 'ember-orbit-config',
  initialize,
};
