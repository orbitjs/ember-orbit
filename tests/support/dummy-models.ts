/* eslint-disable ember/no-computed-properties-in-native-classes */
import { Model, attr, key, hasMany, hasOne } from 'ember-orbit';
import { notEmpty } from '@ember/object/computed';

export class NamedModel extends Model {
  @attr('string') name?: string;
}

export class Planet extends NamedModel {
  @key() remoteId?: string;
  @attr('boolean') atmosphere?: boolean;
  @attr({ type: 'string' }) classification?: string;
  @hasOne('star') sun!: Star | null;
  @hasMany({ type: 'moon', inverse: 'planet' }) moons!: Moon[];
  @hasMany('ocean', { inverse: 'planet' }) oceans!: Ocean[];

  @notEmpty('name') hasName!: boolean;
}

export class Moon extends NamedModel {
  @hasOne('planet', { inverse: 'moons' }) planet!: Planet | null;
}

export class Ocean extends NamedModel {
  @hasOne({ type: 'planet', inverse: 'oceans' }) planet!: Planet | null;
}

export class Star extends NamedModel {
  @hasMany('planet') planets!: Planet[];
  @attr('boolean') isStable!: boolean;
}

export class BinaryStar extends NamedModel {
  @hasOne('star') starOne!: Star | null;
  @hasOne('star') starTwo!: Star | null;
}

export class PlanetarySystem extends NamedModel {
  @hasOne(['binaryStar', 'star']) star!: Star | null;
  @hasMany(['planet', 'moon']) bodies!: (Planet | Moon)[];
}
