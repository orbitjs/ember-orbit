import type ApplicationInstance from '@ember/application/instance';
import { getName } from '../utils/get-name.ts';

class OrbitRegistry {
  application: ApplicationInstance | null = null;
  registrations = {
    buckets: {},
    models: {},
    sources: {},
    strategies: {},
  } as {
    buckets: Record<string, unknown>;
    models: Record<string, unknown>;
    sources: Record<string, unknown>;
    strategies: Record<string, unknown>;
  };
  schemaVersion?: number;
}

export const orbitRegistry = new OrbitRegistry();

function injectModules(application: ApplicationInstance, modules: object) {
  for (const [key, module] of Object.entries(modules)) {
    // TODO: maybe make these not need such specific paths
    if (key.includes('/data-buckets/')) {
      let [, name] = key.split('data-buckets/');
      name = getName(name as string);
      // TODO: maybe find a better way to do `create` here?
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      orbitRegistry.registrations.buckets[name] = module.default?.create?.();
    } else if (key.includes('/data-models/')) {
      let [, name] = key.split('data-models/');
      name = getName(name as string);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      orbitRegistry.registrations.models[name] = module.default ?? module;
    } else if (key.includes('/data-sources/')) {
      let [, name] = key.split('data-sources/');
      name = getName(name as string);
      // TODO: maybe find a better way to do `create` here?
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      orbitRegistry.registrations.sources[name] = module.default?.create?.();
    } else if (key.includes('/data-strategies/')) {
      let [, name] = key.split('data-strategies/');
      name = getName(name as string);
      // TODO: maybe find a better way to do `create` here?
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      orbitRegistry.registrations.strategies[name] = module.default?.create?.();
    }
  }
}

export function setupOrbit(
  application: ApplicationInstance,
  modules: object,
  config?: { schemaVersion?: number },
) {
  orbitRegistry.application = application;
  orbitRegistry.schemaVersion = config?.schemaVersion;
  injectModules(application, modules);
}
