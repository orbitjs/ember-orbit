import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class FilteredRoute extends Route {
  @service store;

  async beforeModel() {
    await this.store.update((t) => {
      const moons = [
        { type: 'moon', attributes: { name: 'Blue' } },
        { type: 'moon', attributes: { name: 'New' } }
      ];
      const operations = [];
      operations.push(t.addRecord(moons[0]));
      operations.push(t.addRecord(moons[1]));

      const plutoOperation = t.addRecord({
        type: 'planet',
        attributes: { name: 'Pluto' }
      });
      const plutoId = plutoOperation.operation.record.id;
      operations.push(plutoOperation);
      operations.push(
        t.addRecord({ type: 'planet', attributes: { name: 'Mars' } })
      );
      operations.push(
        t.addRecord({ type: 'planet', attributes: { name: 'Filtered' } })
      );
      operations.push(
        t.replaceRelatedRecords({ type: 'planet', id: plutoId }, 'moons', moons)
      );
      return operations;
    });
  }

  async model() {
    return this.store.cache.liveQuery((qb) => qb.findRecords('planet'));
  }
}
