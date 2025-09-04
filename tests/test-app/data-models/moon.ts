import { attr, hasOne, Model } from '#src/index.ts';
import Planet from './planet';

export default class Moon extends Model {
  @attr('string') name?: string;
  @hasOne('planet', { inverse: 'moons' }) planet!: Planet[];
}
