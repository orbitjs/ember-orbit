import {
  Coordinator,
  Strategy,
  type CoordinatorOptions,
} from '@orbit/coordinator';
import type ApplicationInstance from '@ember/application/instance';
import type { RequestOptions, Source } from '@orbit/data';
import { orbitRegistry } from '../system/ember-orbit-setup.ts';

type CoordinatorInjections = {
  sourceNames?: string[];
  strategyNames?: string[];
} & CoordinatorOptions;

function isFactory(f?: { create: () => any }): boolean {
  return typeof f === 'object' && typeof f?.create === 'function';
}

export default {
  create(injections: CoordinatorInjections = {}): Coordinator {
    const app = orbitRegistry.application as ApplicationInstance;
    const orbitConfig = orbitRegistry.config;
    debugger;

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
            const key = `${orbitConfig.types.source}:${name}`;
            const factory = app.resolveRegistration(
              key as `${string}:${string}`,
            );
            // @ts-expect-error TODO: fix this type error
            return isFactory(factory)
              ? app.lookup(key as `${string}:${string}`)
              : undefined;
          } else {
            return orbitRegistry.registrations.sources[name];
          }
        })
        .filter((source) => !!source) as Array<
        Source<RequestOptions, RequestOptions, unknown, unknown>
      >;
      debugger;
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
