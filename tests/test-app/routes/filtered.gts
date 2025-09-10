import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { on } from '@ember/modifier';
import { fn } from '@ember/helper';
import type { ModelAwareTransformBuilder } from '#src/-private/utils/model-aware-types.ts';
import type { Store } from '#src/index.ts';

export default class FilteredRoute extends Route {
  @service declare store: Store;

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

  <template>
    {{!@glint-nocheck}}
    <ul class="planets">
      {{#each @controller.filteredPlanets as |planet|}}
        <li class="planet-row">
          {{planet.name}}

          <div>
            Moons:
            <ul class="moons">
              {{#each planet.moons as |moon|}}
                <li>
                  {{moon.name}}
                </li>
              {{/each}}
            </ul>
          </div>

          <button
            data-test-duplicate={{planet.name}}
            type="button"
            {{on "click" (fn @controller.duplicatePlanet planet)}}
          >
            Duplicate
          </button>

          <button
            data-test-delete={{planet.name}}
            type="button"
            {{on "click" (fn @controller.deletePlanet planet)}}
          >
            Delete
          </button>
        </li>
      {{/each}}
    </ul>

    <div class="planets-count">
      {{@controller.filteredPlanets.length}}
    </div>
  </template>
}
