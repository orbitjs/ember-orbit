import { getOwner } from '@ember/application';
import Coordinator from '@orbit/coordinator';
import modulesOfType from '../system/modules-of-type';

export default {
  create(injections = {}) {
    const owner = getOwner(injections);

    let sourceNames;
    if (injections.sourceNames) {
      sourceNames = injections.sourceNames;
      delete injections.sourceNames;
    } else {
      sourceNames = modulesOfType(owner.base.modulePrefix, 'data-sources');
      sourceNames.push('store');
    }

    let strategyNames;
    if (injections.strategyNames) {
      strategyNames = injections.strategyNames;
      delete injections.strategyNames;
    } else {
      strategyNames = modulesOfType(owner.base.modulePrefix, 'data-strategies');
    }

    injections.sources = sourceNames.map(name => owner.lookup(`data-source:${name}`));

    injections.strategies = strategyNames.map(name => owner.lookup(`data-strategy:${name}`));

    return new Coordinator(injections);
  }
}
