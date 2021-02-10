import { Model, attr, hasMany } from 'ember-orbit';

import MoonModel from 'dummy/data-models/moon';

export default class PlanetModel extends Model {
  @attr('string') name!: string;
  @hasMany('moon', { inverse: 'planet', dependent: 'remove' })
  moons!: MoonModel[];
}
