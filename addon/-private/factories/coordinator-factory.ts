import { getOwner } from '@ember/application';
import { Coordinator, CoordinatorOptions } from '@orbit/coordinator';
import modulesOfType from '../system/modules-of-type';

type CoordinatorInjections = {
  sourceNames?: string[];
  strategyNames?: string[];
} & CoordinatorOptions;

export default {
  create(injections: CoordinatorInjections = {}): Coordinator {
    const app = getOwner(injections);
    const orbitConfig = app.lookup('ember-orbit:config');

    if (injections.sources === undefined) {
      let sourceNames: string[];
      if (injections.sourceNames) {
        sourceNames = injections.sourceNames;
        delete injections.sourceNames;
      } else {
        sourceNames =
          app.lookup('ember-orbit:source-names') ??
          modulesOfType(app.base.modulePrefix, orbitConfig.collections.sources);
        sourceNames.push('store');
      }
      injections.sources = sourceNames
        .map((name) => app.lookup(`${orbitConfig.types.source}:${name}`))
        .filter((source) => !!source);
    }

    if (injections.strategies === undefined) {
      let strategyNames: string[];
      if (injections.strategyNames) {
        strategyNames = injections.strategyNames;
        delete injections.strategyNames;
      } else {
        strategyNames =
          app.lookup('ember-orbit:strategy-names') ??
          modulesOfType(
            app.base.modulePrefix,
            orbitConfig.collections.strategies
          );
      }
      injections.strategies = strategyNames
        .map((name) => app.lookup(`${orbitConfig.types.strategy}:${name}`))
        .filter((strategy) => !!strategy);
    }

    return new Coordinator(injections);
  }
};
