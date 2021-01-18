import { Model, attr, hasOne } from 'ember-orbit';

import PlanetModel from 'dummy/data-models/planet';

export default class MoonModel extends Model {
  @attr('string') name!: string;
  @hasOne('planet', { inverse: 'moons' })
  planet!: PlanetModel[];
}
