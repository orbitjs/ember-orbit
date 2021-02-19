import { Model, attr, hasOne } from 'ember-orbit';

import Planet from 'dummy/data-models/planet';

export default class Moon extends Model {
  @attr('string') name?: string;
  @hasOne('planet', { inverse: 'moons' }) planet!: Planet[];
}
