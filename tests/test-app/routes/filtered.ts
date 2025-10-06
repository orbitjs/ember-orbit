import Route from '@ember/routing/route';
import type { ModelAwareTransformBuilder } from '#src/-private/utils/model-aware-types.ts';
import { orbit } from '#src/index.ts';

export default class FilteredRoute extends Route {
  @orbit declare store;

  async beforeModel() {
    await this.store.update((t: ModelAwareTransformBuilder) => {
      const blueMoonId = this.store.schema.generateId('moon');
      const newMoonId = this.store.schema.generateId('moon');
      const plutoId = this.store.schema.generateId('planet');

      return [
        t.addRecord({
          type: 'moon',
          id: blueMoonId,
          attributes: { name: 'Blue' },
        }),
        t.addRecord({
          type: 'moon',
          id: newMoonId,
          attributes: { name: 'New' },
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
                { type: 'moon', id: newMoonId },
              ],
            },
          },
        }),
      ];
    });
  }

  model() {
    return this.store.cache.liveQuery((qb) => qb.findRecords('planet'));
  }
}
