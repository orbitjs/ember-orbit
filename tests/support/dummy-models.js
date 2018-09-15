import {
  Model,
  attr,
  key,
  hasMany,
  hasOne
} from 'ember-orbit';

export const Orbitable = Model.extend({
  name: attr('string'),
});

export const Planet = Orbitable.extend({
  remoteId: key(),
  atmosphere: attr('boolean'),
  classification: attr('string'),
  sun: hasOne('star'),
  moons: hasMany('moon', {inverse: 'planet'})
});

export const Moon = Orbitable.extend({
  planet: hasOne('planet', {inverse: 'moons'})
});

export const Star = Orbitable.extend({
  planets: hasMany('planet'),
  isStable: attr('boolean')
});
