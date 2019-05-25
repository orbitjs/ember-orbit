import { Model, attr, key, hasMany, hasOne } from 'ember-orbit';

export const Planet = Model.extend({
  remoteId: key(),
  name: attr('string'),
  atmosphere: attr('boolean'),
  classification: attr('string'),
  sun: hasOne('star'),
  moons: hasMany('moon', { inverse: 'planet' })
});

export const Moon = Model.extend({
  name: attr('string'),
  planet: hasOne('planet', { inverse: 'moons' })
});

export const Star = Model.extend({
  name: attr('string'),
  planets: hasMany('planet'),
  isStable: attr('boolean')
});
