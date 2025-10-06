import { orbitRegistry } from '../utils/orbit-registry.ts';
import { Coordinator, type CoordinatorOptions } from '@orbit/coordinator';

type CoordinatorInjections = {
  sourceNames?: string[];
  strategyNames?: string[];
} & CoordinatorOptions;

export default {
  create(injections: CoordinatorInjections = {}): Coordinator {
    if (injections.sources === undefined) {
      let sourceNames: string[];
      if (injections.sourceNames) {
        sourceNames = injections.sourceNames;
        delete injections.sourceNames;
      } else {
        sourceNames = Object.keys(orbitRegistry.registrations.sources);
      }
      injections.sources = sourceNames
        .map((name) => {
          return orbitRegistry.registrations.sources[name];
        })
        .filter((source) => !!source);
    }

    if (injections.strategies === undefined) {
      let strategyNames: string[];
      if (injections.strategyNames) {
        strategyNames = injections.strategyNames;
        delete injections.strategyNames;
      } else {
        strategyNames = Object.keys(orbitRegistry.registrations.strategies);
      }
      injections.strategies = strategyNames
        .map((name) => {
          return orbitRegistry.registrations.strategies[name];
        })
        .filter((strategy) => !!strategy);
    }

    return new Coordinator(injections);
  },
};
