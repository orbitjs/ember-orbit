import { orbitRegistry } from '../utils/orbit-registry.ts';
import { Coordinator, type CoordinatorOptions } from '@orbit/coordinator';

type CoordinatorInjections = {
  sourceNames?: string[];
  strategyNames?: string[];
} & CoordinatorOptions;

export default {
  create(): Coordinator {
    const injections: CoordinatorInjections = {};

    const sourceNames = Object.keys(orbitRegistry.registrations.sources);
    injections.sources = sourceNames
      .map((name) => {
        return orbitRegistry.registrations.sources[name];
      })
      .filter((source) => !!source);

    const strategyNames = Object.keys(orbitRegistry.registrations.strategies);
    injections.strategies = strategyNames
      .map((name) => {
        return orbitRegistry.registrations.strategies[name];
      })
      .filter((strategy) => !!strategy);

    return new Coordinator(injections);
  },
};
