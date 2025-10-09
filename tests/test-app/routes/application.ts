import { getOwner } from '@ember/owner';
import type Owner from '@ember/owner';
import Route from '@ember/routing/route';
import { orbit, setupOrbit } from '#src/index.ts';
import type Coordinator from '@orbit/coordinator';

const dataModels = import.meta.glob('../data-models/*.{js,ts}', {
  eager: true,
});
const dataSources = import.meta.glob('../data-sources/*.{js,ts}', {
  eager: true,
});
const dataStrategies = import.meta.glob('../data-strategies/*.{js,ts}', {
  eager: true,
});

export default class ApplicationRoute extends Route {
  @orbit declare dataCoordinator: Coordinator;

  async beforeModel() {
    const owner = getOwner(this) as Owner;

    setupOrbit(owner, {
      ...dataModels,
      ...dataSources,
      ...dataStrategies,
    });

    await this.dataCoordinator.activate();
  }
}
