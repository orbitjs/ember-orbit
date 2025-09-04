import type ApplicationInstance from '@ember/application/instance';
import { orbitRegistry } from '../system/ember-orbit-setup.ts';
import {
  Coordinator,
  Strategy,
  type CoordinatorOptions,
} from '@orbit/coordinator';
import type { RequestOptions, Source } from '@orbit/data';

type CoordinatorInjections = {
  sourceNames?: string[];
  strategyNames?: string[];
} & CoordinatorOptions;

export default {
  create(injections: CoordinatorInjections = {}): Coordinator {
    const app = orbitRegistry.application as ApplicationInstance;

    if (injections.sources === undefined) {
      let sourceNames: string[];
      if (injections.sourceNames) {
        sourceNames = injections.sourceNames;
        delete injections.sourceNames;
      } else {
        sourceNames = Object.keys(orbitRegistry.registrations.sources);
        sourceNames.push('store');
      }
      injections.sources = sourceNames
        .map((name) => {
          if (name === 'store') {
            return app.lookup('data-source:store');
          } else {
            return orbitRegistry.registrations.sources[name];
          }
        })
        .filter((source) => !!source) as Array<
        Source<RequestOptions, RequestOptions, unknown, unknown>
      >;
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
        .filter((strategy) => !!strategy) as Array<Strategy>;
    }

    return new Coordinator(injections);
  },
};
