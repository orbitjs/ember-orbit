import Orbit from 'orbit';
import attr from 'ember_orbit/attr';
import hasOne from 'ember_orbit/has_one';
import hasMany from 'ember_orbit/has_many';
import Store from 'ember_orbit/store';
import Model from 'ember_orbit/model';
import { createStore } from 'test_helper';

var get = Ember.get;
var Planet,
    Moon,
    Star,
    store;

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

test("#modelFor returns the appropriate model when passed a model's name", function() {
  equal(store.modelFor('star'), Star);
});

test("#modelFor returns the appropriate model when passed the model itself", function() {
  equal(store.modelFor(Star), Star);
});
