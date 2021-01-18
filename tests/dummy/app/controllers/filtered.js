import Controller from '@ember/controller';

export default class FilteredController extends Controller {
  get modelArray() {
    return this.model.value;
  }

  get filteredPlanets() {
    let planets = this.modelArray || [];

    return planets.filter((planet) => planet.name !== 'Filtered');
  }
}