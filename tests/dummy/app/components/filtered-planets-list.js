import Component from '@glimmer/component';

export default class FilteredPlanetsList extends Component {
  get modelArray() {
    return this.args.planets.value;
  }

  get filteredPlanets() {
    let planets = this.modelArray || [];

    return planets.filter((planet) => planet.name !== 'Filtered');
  }
}
