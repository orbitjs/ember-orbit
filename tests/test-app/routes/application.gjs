import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class ApplicationRoute extends Route {
  @service dataCoordinator;

  async beforeModel() {
    await this.dataCoordinator.activate();
  }

  <template>
    Hello
    {{outlet}}
  </template>
}
