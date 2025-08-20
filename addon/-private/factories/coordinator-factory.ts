import { getOwner } from '@ember/application';
import {
  Coordinator,
  Strategy,
  type CoordinatorOptions,
} from '@orbit/coordinator';
import modulesOfType from '../system/modules-of-type';
import type ApplicationInstance from '@ember/application/instance';
import type { OrbitConfig } from 'ember-orbit/initializers/ember-orbit-config';
import type { RequestOptions, Source } from '@orbit/data';

type CoordinatorInjections = {
  sourceNames?: string[];
  strategyNames?: string[];
} & CoordinatorOptions;

function isFactory(f?: { create: () => any }): boolean {
  return typeof f === 'object' && typeof f?.create === 'function';
}

export default {
  create(injections: CoordinatorInjections = {}): Coordinator {
    const app = getOwner(injections) as ApplicationInstance;
    const orbitConfig = app.lookup('ember-orbit:config') as OrbitConfig;

    if (injections.sources === undefined) {
      let sourceNames: string[];
      if (injections.sourceNames) {
        sourceNames = injections.sourceNames;
        delete injections.sourceNames;
      } else {
        sourceNames = ((app.lookup(
          'ember-orbit:source-names'
        ) as Array<string>) ??
          modulesOfType(
            // @ts-expect-error TODO: fix this type error
            app.base.modulePrefix,
            orbitConfig.collections.sources
          ));
        sourceNames.push('store');
      }
      injections.sources = sourceNames
        .map((name) => {
          const key = `${orbitConfig.types.source}:${name}`;
          const factory = app.resolveRegistration(key as `${string}:${string}`);
          // @ts-expect-error TODO: fix this type error
          return isFactory(factory)
            ? app.lookup(key as `${string}:${string}`)
            : undefined;
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
        strategyNames =
          (app.lookup('ember-orbit:strategy-names') as Array<string>) ??
          modulesOfType(
            // @ts-expect-error TODO: fix this type error
            app.base.modulePrefix,
            orbitConfig.collections.strategies
          );
      }
      injections.strategies = strategyNames
        .map((name) => {
          const key = `${orbitConfig.types.strategy}:${name}`;
          const factory = app.resolveRegistration(key as `${string}:${string}`);
          // @ts-expect-error TODO: fix this type error
          return isFactory(factory)
            ? app.lookup(key as `${string}:${string}`)
            : undefined;
        })
        .filter((strategy) => !!strategy) as Array<Strategy>;
    }

    return new Coordinator(injections);
  },
};
