import Route from '@ember/routing/route';
import { service } from '@ember/service';
import { setupOrbit } from '#src/index.ts';
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
  @service declare dataCoordinator: Coordinator;

  async beforeModel() {
    setupOrbit({
      ...dataModels,
      ...dataSources,
      ...dataStrategies,
    });

    await this.dataCoordinator.activate();
  }
}
