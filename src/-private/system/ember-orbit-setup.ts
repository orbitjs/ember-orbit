import type ApplicationInstance from '@ember/application/instance';
import { getName } from '../utils/get-name.ts';
import {
  setupEmberOrbitConfig,
  type OrbitConfig,
} from './ember-orbit-config.ts';

class OrbitRegistry {
  application: ApplicationInstance | null = null;
  config = {} as OrbitConfig;
  registrations = {
    models: {},
    sources: {},
    strategies: {},
  };
}

export const orbitRegistry = new OrbitRegistry();

function injectModules(application: ApplicationInstance, modules: object) {
  for (const [key, module] of Object.entries(modules)) {
    // TODO: maybe make these not need such specific paths
    if (key.includes('/data-models/')) {
      let [, name] = key.split('data-models/');
      name = getName(name as string);
      orbitRegistry.registrations.models[name] = module.default ?? module;
    } else if (key.includes('/data-sources/')) {
      let [, name] = key.split('data-sources/');
      name = getName(name as string);
      orbitRegistry.registrations.sources[name] = module.default;
    } else if (key.includes('/data-strategies/')) {
      let [, name] = key.split('data-strategies/');
      name = getName(name as string);
      orbitRegistry.registrations.strategies[name] = module.default;
    }
  }
}

export function setupOrbit(application: ApplicationInstance, modules: object) {
  const orbitConfig = setupEmberOrbitConfig(application);
  orbitRegistry.application = application;
  orbitRegistry.config = orbitConfig;
  injectModules(application, modules);
}
