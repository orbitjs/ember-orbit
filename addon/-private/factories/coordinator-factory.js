import { getOwner } from '@ember/application';
import Coordinator from '@orbit/coordinator';
import modulesOfType from '../system/modules-of-type';

export default {
  create(injections = {}) {
    const app = getOwner(injections);
    let orbitConfig = app.lookup('ember-orbit:config');

    let sourceNames;
    if (injections.sourceNames) {
      sourceNames = injections.sourceNames;
      delete injections.sourceNames;
    } else {
      sourceNames = modulesOfType(app.base.modulePrefix, orbitConfig.collections.sources);
      sourceNames.push('store');
    }

    let strategyNames;
    if (injections.strategyNames) {
      strategyNames = injections.strategyNames;
      delete injections.strategyNames;
    } else {
      strategyNames = modulesOfType(app.base.modulePrefix, orbitConfig.collections.strategies);
    }

    injections.sources = sourceNames.map(name => app.lookup(`${orbitConfig.types.source}:${name}`));
    injections.strategies = strategyNames.map(name => app.lookup(`${orbitConfig.types.strategy}:${name}`));

    return new Coordinator(injections);
  }
}
