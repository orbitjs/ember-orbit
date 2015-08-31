import Orbit from 'orbit';
import attr from 'ember-orbit/fields/attr';
import hasOne from 'ember-orbit/fields/has-one';
import hasMany from 'ember-orbit/fields/has-many';
import Transaction from 'ember-orbit/transaction';
import Model from 'ember-orbit/model';
import { createStore } from 'tests/test-helper';

var get = Ember.get;
// var set = Ember.set;

var Planet,
    Moon,
    Star,
    store;

module("Unit - Transaction", {
  setup: function() {
    Orbit.Promise = Ember.RSVP.Promise;

    Planet = Model.extend({
      name: attr('string'),
      atmosphere: attr('boolean'),
      classification: attr('string'),
      sun: hasOne('star'),
      moons: hasMany('moon')
    });

    Moon = Model.extend({
      name: attr('string'),
      planet: hasOne('planet')
    });

    Star = Model.extend({
      name: attr('string'),
      planets: hasMany('planet')
    });

    store = createStore({
      models: {
        planet: Planet,
        moon: Moon,
        star: Star
      }
    });
  },

  teardown: function() {
    Orbit.Promise = null;
    Planet = null;
    Moon = null;
    Star = null;
    store = null;
  }
});

test("it can be created independently", function(assert) {
  var transaction = Transaction.create({
    baseStore: store
  });

  assert.ok(transaction);
});

test("it can be created from a store", function(assert) {
  var transaction = store.createTransaction();

  assert.ok(transaction);
  assert.strictEqual(get(transaction, 'baseStore'), store, 'baseStore is set');
});

test("tracks changes which can then be committed to the base store", function(assert) {
  var transaction = store.createTransaction();
  var jupiter;

  return transaction.add('planet', {name: 'Jupiter', classification: 'gas giant'})
    .then(function(planet) {
      jupiter = planet;
      return transaction.commit();
    })
    .then(function() {
      assert.equal(get(store.all('planet'), 'length'), 1, 'base store now has a planet');
      var jupiterInBaseStore = store.retrieve('planet', get(jupiter, 'id'));
      assert.deepEqual(get(jupiterInBaseStore, 'name'), 'Jupiter', 'planet matches');
    });
});
