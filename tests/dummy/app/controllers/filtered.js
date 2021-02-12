import Controller from '@ember/controller';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';

import { clone } from '@orbit/utils';

export default class FilteredController extends Controller {
  @service store;
  @service dataSchema;
  @service undoManager;

  get modelArray() {
    return this.model.value;
  }

  get filteredPlanets() {
    let planets = this.modelArray || [];

    return planets.filter((planet) => planet.name !== 'Filtered');
  }

  @action
  async deletePlanet(planet) {
    await this.store.update((t) => t.removeRecord(planet));
    this.undoManager.setupUndoRedo();
  }

  @action
  async duplicatePlanet(planet) {
    const planetCopy = clone(planet.getData());
    planetCopy.id = this.dataSchema.generateId('planet');
    delete planetCopy.relationships;
    await this.store.update((t) => {
      const addPlanetOperation = t.addRecord(planetCopy);

      const operations = [addPlanetOperation];

      planet.moons.forEach((moon) => {
        const moonCopy = clone(moon.getData());
        moonCopy.id = this.dataSchema.generateId('moon');
        delete moonCopy.relationships;
        const addMoonOperation = t.addRecord(moonCopy);

        operations.push(addMoonOperation);
        operations.push(
          t.replaceRelatedRecord({ type: 'moon', id: moonCopy.id }, 'planet', {
            type: 'planet',
            id: planetCopy.id
          })
        );
      });

      return operations;
    });

    this.undoManager.setupUndoRedo();
  }
}
