import { Model, attr, hasMany } from 'ember-orbit';

import Moon from 'dummy/data-models/moon';

export default class Planet extends Model {
  @attr('string') name?: string;
  @hasMany('moon', { inverse: 'planet', dependent: 'remove' }) moons!: Moon[];
}
