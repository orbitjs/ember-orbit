import { getName } from '../utils/get-name';

class OrbitModuleRegistry {
  registrations = {
    models: {},
    sources: {},
    strategies: {},
  };
}

export const orbitModuleRegistry = new OrbitModuleRegistry();

function injectModules(modules: object) {
  for (const [key, module] of Object.entries(modules)) {
    if (module.default) {
      if (key.includes('/data-models/')) {
        let [, name] = key.split('data-models/');
        name = getName(name as string);
        orbitModuleRegistry.registrations.models[name] = module.default;
      } else if (key.includes('/data-sources/')) {
        let [, name] = key.split('data-sources/');
        name = getName(name as string);
        orbitModuleRegistry.registrations.sources[name] = module.default;
      } else if (key.includes('/data-strategies/')) {
        let [, name] = key.split('data-strategies/');
        name = getName(name as string);
        orbitModuleRegistry.registrations.strategies[name] = module.default;
      }
    }
  }
}

export function setupOrbit(modules: any) {
  injectModules(modules);
}
