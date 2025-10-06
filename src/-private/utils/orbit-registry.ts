import type Owner from '@ember/owner';
import type ModelFactory from '../model-factory.ts';
import type { OrbitServiceRegistry } from '../types/service-registry.ts';
import type { Strategy } from '@orbit/coordinator';
import type { Bucket } from '@orbit/core';
import type { Source } from '@orbit/data';

class OrbitRegistry {
  application: Owner | null = null;
  registrations: {
    buckets: Record<'main', Bucket>;
    models: Record<string, ModelFactory>;
    sources: Record<string, Source>;
    strategies: Record<string, Strategy>;
    services: OrbitServiceRegistry;
  } = {
    buckets: {} as Record<'main', Bucket>,
    models: {},
    sources: {},
    strategies: {},
    services: {} as OrbitServiceRegistry,
  };
  schemaVersion?: number;
}

export const orbitRegistry = new OrbitRegistry();
