import Route from '@ember/routing/route';
import { orbit, setupOrbit } from '#src/index.ts';

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
@orbit declare dataCoordinator;

  async beforeModel() {
    setupOrbit({
      ...dataModels,
      ...dataSources,
      ...dataStrategies,
    });

    await this.dataCoordinator.activate();
  }
}
