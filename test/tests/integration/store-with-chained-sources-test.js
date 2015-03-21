import Orbit from 'orbit';
import attr from 'ember-orbit/fields/attr';
import hasOne from 'ember-orbit/fields/has-one';
import hasMany from 'ember-orbit/fields/has-many';
import Store from 'ember-orbit/store';
import Model from 'ember-orbit/model';
import { createStore } from 'tests/test-helper';
import { RecordNotFoundException } from 'orbit-common/lib/exceptions';
import RequestConnector from 'orbit/request-connector';
import MemorySource from 'orbit-common/memory-source';


Ember.RSVP.on('error', function(error){
  debugger;
});

var get = Ember.get,
    set = Ember.set;

var Planet,
    Moon,
    Star,
    store,
    supportingSource;

module('Integration - Store with chained sources', {
  setup: function() {
    Orbit.Promise = Ember.RSVP.Promise;

    Star = Model.extend({
      name: attr('string'),
      planets: hasMany('planet', {inverse: 'sun'}),
      isStable: attr('boolean', {defaultValue: true})
    });

    Moon = Model.extend({
      name: attr('string'),
      planet: hasOne('planet', {inverse: 'moons'})
    });

    Planet = Model.extend({
      name: attr('string'),
      classification: attr('string'),
      sun: hasOne('star', {inverse: 'planets'}),
      moons: hasMany('moon', {inverse: 'planet'})
    });

    store = createStore({
      models: {
        star: Star,
        moon: Moon,
        planet: Planet
      }
    });

    supportingSource = new MemorySource(store.get('schema')._schema);

    store.orbitSource.on('rescueFindLinked', function(){
      return supportingSource.findLinked.apply(null, arguments);
    });
  },

  teardown: function() {
    Orbit.Promise = null;
    Star = null;
    Moon = null;
    Planet = null;
    store = null;
    supportingSource = null;
  }
});

test('findLinked', function(){
  expect(2);
  stop();

  var jupiter = { id: 'jupiterId123', name: 'Jupiter', __rel: { sun: 'sun1' } };
  var sun = { id: 'sun1', name: "The Sun!" };

  store.orbitSource.reset({
    planet: {
      'jupiterId123': jupiter
    }
  });

  supportingSource.reset({
    star: {
      'sun1': sun
    }
  });

  // supportingSource.findLinked = function(){
  // 	// simulates supportingSource adding record to it's cache which is propagated to the other sources
  //   store.orbitSource.transform({op: 'add', path: ['star', 'sun1'], value: sun});
  //   return Ember.RSVP.resolve(sun);
  // };

  Ember.run(function() {

    store.find('planet', 'jupiterId123')
    .then(function(jupiter){
      return jupiter.get('sun');
    })
      .then(function(sun){
        start();
        equal(sun.get("id"), 'sun1', "sun id was lazy loaded");
        equal(sun.get("name"), 'The Sun!', "sun name was lazy loaded");
    }).catch(function(error){
      debugger;

    });
  });

});
