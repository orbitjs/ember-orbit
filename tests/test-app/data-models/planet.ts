import { Model, attr, hasMany } from '#src/index.ts';

import Moon from './moon';

export default class Planet extends Model {
  @attr('string') name?: string;
  @hasMany('moon', { inverse: 'planet', dependent: 'remove' }) moons!: Moon[];
}
