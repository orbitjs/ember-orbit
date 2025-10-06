import Route from '@ember/routing/route';
import { orbit } from '#src/index.ts';

export default class ApplicationRoute extends Route {
  @orbit declare dataCoordinator;

  async beforeModel() {
    await this.dataCoordinator.activate();
  }
}
