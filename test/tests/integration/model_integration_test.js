import Orbit from 'orbit';
import attr from 'ember_orbit/attr';
import hasOne from 'ember_orbit/has_one';
import hasMany from 'ember_orbit/has_many';
import Store from 'ember_orbit/store';
import Model from 'ember_orbit/model';

var get = Ember.get;
var Planet,
    Moon,
    Star,
    store;

var createStore = function(options) {
  options = options || {};

  var container = new Ember.Container();

  for (var prop in options) {
    container.register('model:' + prop, options[prop]);
  }

  container.register('store:main', Store.extend({
  }));

  return container.lookup('store:main');
};

module("Integration - Model", {
  setup: function() {
    Orbit.Promise = Ember.RSVP.Promise;

    Star = Model.extend({
      name: attr('string'),
      planets: hasMany('planet')
    });

    Moon = Model.extend({
      name: attr('string'),
      planet: hasOne('planet')
    });

    Planet = Model.extend({
      name: attr('string'),
      classification: attr('string'),
      sun: hasOne('star'),
      moons: hasMany('moon')
    });

    store = createStore({
      star: Star,
      moon: Moon,
      planet: Planet
    });
  },

  teardown: function() {
    Planet = null;
  }
});

test("store exists", function() {
  ok(store);
});