import { getOwner } from '@ember/owner';
import type Owner from '@ember/owner';
import { getOrbitRegistry } from '../utils/orbit-registry.ts';
import { Coordinator, type CoordinatorOptions } from '@orbit/coordinator';

export type CoordinatorInjections = {
  sourceNames?: string[];
  strategyNames?: string[];
} & CoordinatorOptions;

export default {
  create(injections: CoordinatorInjections = {}): Coordinator {
    const owner = getOwner(injections) as Owner;
    const orbitRegistry = getOrbitRegistry(owner);
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
