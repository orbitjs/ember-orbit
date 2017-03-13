import Model from 'ember-orbit/model';
import attr from 'ember-orbit/fields/attr';
import key from 'ember-orbit/fields/key';
import hasOne from 'ember-orbit/fields/has-one';
import hasMany from 'ember-orbit/fields/has-many';

var Planet = Model.extend({
  galaxyAlias: key(),
  name: attr('string'),
  atmosphere: attr('boolean'),
  classification: attr('string'),
  sun: hasOne('star'),
  moons: hasMany('moon', {inverse: 'planet'})
});

var Moon = Model.extend({
  name: attr('string'),
  planet: hasOne('planet', {inverse: 'moons'})
});

var Star = Model.extend({
  name: attr('string'),
  planets: hasMany('planet'),
  isStable: attr('boolean')
});

var dummyModels = {
  Planet,
  Moon,
  Star
};

export {
  dummyModels
};
