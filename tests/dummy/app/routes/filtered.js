import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class FilteredRoute extends Route {
  @service store;

  async beforeModel() {
    await this.store.update((t) => {
      const blueMoonId = this.store.schema.generateId('moon');
      const newMoonId = this.store.schema.generateId('moon');
      const plutoId = this.store.schema.generateId('planet');

      return [
        t.addRecord({
          type: 'moon',
          id: blueMoonId,
          attributes: { name: 'Blue' }
        }),
        t.addRecord({
          type: 'moon',
          id: newMoonId,
          attributes: { name: 'New' }
        }),
        t.addRecord({ type: 'planet', attributes: { name: 'Mars' } }),
        t.addRecord({ type: 'planet', attributes: { name: 'Filtered' } }),
        t.addRecord({
          type: 'planet',
          id: plutoId,
          attributes: { name: 'Pluto' },
          relationships: {
            moons: {
              data: [
                { type: 'moon', id: blueMoonId },
                { type: 'moon', id: newMoonId }
              ]
            }
          }
        })
      ];
    });
  }

  async model() {
    return this.store.cache.liveQuery((qb) => qb.findRecords('planet'));
  }
}
