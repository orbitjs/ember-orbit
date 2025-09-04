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
  }
};

export function setupEmberOrbitConfig(application: ApplicationInstance) {
  const envConfig = application.resolveRegistration('config:environment') ?? {};

  const config = deepMerge(
    {},
    DEFAULT_ORBIT_CONFIG,
    // @ts-expect-error TODO: fix this type error
    envConfig.orbit ?? {},
  ) as OrbitConfig;

  return config;
}
