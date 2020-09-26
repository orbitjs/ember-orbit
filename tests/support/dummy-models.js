import { Model, attr, key, hasMany, hasOne } from 'ember-orbit';

export class NamedModel extends Model {
  @attr('string') name;
}

export class Planet extends NamedModel {
  @key() remoteId;
  @attr('boolean') atmosphere;
  @attr('string') classification;
  @hasOne('star') sun;
  @hasMany('moon', { inverse: 'planet' }) moons;
  @hasMany('ocean', { inverse: 'planet' }) oceans;
}

export class Moon extends NamedModel {
  @hasOne('planet', { inverse: 'moons' }) planet;
}

export class Ocean extends NamedModel {
  @hasOne('planet', { inverse: 'oceans' }) planet;
}

export class Star extends NamedModel {
  @hasMany('planet') planets;
  @attr('boolean') isStable;
}

export class BinaryStar extends NamedModel {
  @hasOne('star') starOne;
  @hasOne('star') starTwo;
}

export class PlanetarySystem extends NamedModel {
  @hasOne(['binaryStar', 'star']) star;
  @hasMany(['planet', 'moon']) bodies;
}
