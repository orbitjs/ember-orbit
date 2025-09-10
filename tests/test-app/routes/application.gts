import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import type ApplicationInstance from '@ember/application/instance';
import { setupOrbit } from '#src/index.ts';
import { getOwner } from '@ember/-internals/owner';
import type Coordinator from '@orbit/coordinator';

const dataModels = import.meta.glob('./test-app/data-models/*.{js,ts}', {
  eager: true,
});
const dataSources = import.meta.glob('./test-app/data-sources/*.{js,ts}', {
  eager: true,
});
const dataStrategies = import.meta.glob(
  './test-app/data-strategies/*.{js,ts}',
  {
    eager: true,
  },
);

export default class ApplicationRoute extends Route {
  @service declare dataCoordinator: Coordinator;

  async beforeModel() {
    const application = getOwner(this) as ApplicationInstance;

    setupOrbit(application, {
      ...dataModels,
      ...dataSources,
      ...dataStrategies,
    });

    await this.dataCoordinator.activate();
  }

  <template>
    Hello
    {{outlet}}
  </template>
}
