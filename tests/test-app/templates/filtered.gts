import RouteTemplate from 'ember-route-template';
import { on } from '@ember/modifier';
import { fn } from '@ember/helper';

export default RouteTemplate(
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
  </template>,
);
