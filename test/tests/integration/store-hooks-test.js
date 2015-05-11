import Orbit from 'orbit';
import OCLocalStorageSource from 'orbit-common/local-storage-source';
import { RecordNotFoundException, RecordAlreadyExistsException } from 'orbit-common/lib/exceptions';
import attr from 'ember-orbit/fields/attr';
import hasOne from 'ember-orbit/fields/has-one';
import hasMany from 'ember-orbit/fields/has-many';
import Store from 'ember-orbit/store';
import Model from 'ember-orbit/model';
import Schema from 'ember-orbit/schema';
import { createStore } from 'tests/test-helper';
import { spread } from 'orbit/lib/functions';

var get = Ember.get,
    set = Ember.set;

var Planet,
    Moon,
    Star,
    store,
    planetObserver;

var PlanetObserver = Ember.Object.extend(Ember.Evented, {
  initialize: function(){
    this.afterAddRecord = sinon.spy();
    this.afterRemoveRecord = sinon.spy();
    this.afterPatchRecord = sinon.spy();
    this.afterAddLink = sinon.spy();
    this.afterRemoveLink = sinon.spy();
  }.on('init'),

  afterAddRecordListener: function(){
    this.afterAddRecord.apply(this, arguments);
  }.on('afterAddRecord'),

  afterRemoveRecordListener: function(){
    this.afterRemoveRecord.apply(this, arguments);
  }.on('afterRemoveRecord'),

  afterPatchRecordListener: function(){
    this.afterPatchRecord.apply(this, arguments);
  }.on('afterPatchRecord'),

  afterAddLinkListener: function(){
    this.afterAddLink.apply(this, arguments);
  }.on('afterAddLink'),

  afterRemoveLinkListener: function(){
    this.afterRemoveLink.apply(this, arguments);
  }.on('afterRemoveLink')
});

module("Unit - Store - hooks", {
  setup: function() {
    Orbit.Promise = Ember.RSVP.Promise;

    Planet = Model.extend({
      name: attr('string'),
      atmosphere: attr('boolean'),
      classification: attr('string'),
      moons: hasMany('moon'),
      sun: hasOne('star')
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

    store.container.register("observer:planet", PlanetObserver);
    planetObserver = store.container.lookup("observer:planet");
  },

  teardown: function() {
    Orbit.Promise = null;
    Planet = null;
    Moon = null;
    Star = null;
    store = null;
    planetObserver = null;
  }
});

test("add record fires afterAddRecord hook", function(){
  expect(1);
  stop();

  var jupiterDetails = {name: "Jupiter"};

  store.add('planet', jupiterDetails).then(function(){
    start();
    var jupiter = store.all('planet').objectAt(0);

    var callbackArgs = planetObserver.afterAddRecord.firstCall.args;
    deepEqual(callbackArgs, [jupiter], 'afterAddRecord triggered with record');
  });
});

test("remove record fires afterRemoveRecord hook", function(){
  expect(1);
  stop();

  var jupiterDetails = {name: "Jupiter"};

  store.add('planet', jupiterDetails)
    .then(function(jupiter){
      store.remove('planet', jupiter.get("id"))
        .then(function(){
          start();
          var callbackArgs = planetObserver.afterRemoveRecord.firstCall.args;
          deepEqual(callbackArgs, [jupiter], 'afterRemoveRecord triggered with record');
        });
    });
});

test("patch record fires afterPatchRecord hook", function(){
  expect(1);
  stop();

  var jupiterDetails = {name: 'Jupiter'};

  store.add('planet', jupiterDetails).then(function(jupiter){
    store.patch('planet', jupiter.get('id'), 'name', 'Jupiter2').then(function(){
      start();
      var callbackArgs = planetObserver.afterPatchRecord.firstCall.args;
      deepEqual(callbackArgs, [jupiter, 'name', 'Jupiter2'], 'afterPatchRecord triggered with record, field and value');
    });
  });
});

test("add link to hasMany fires afterAddLink hook", function(){
  expect(1);
  stop();

  var jupiterDetails = {name: "Jupiter"};
  var moonDetails = {name: "callisto"};

  Ember.RSVP.all([
    store.add('planet', jupiterDetails),
    store.add('moon', moonDetails)

  ]).then(spread(function(jupiter, callisto){
    store.addLink('planet', jupiter.get('id'), 'moons', callisto.get('id')).then(function(){
      start();
      var callbackArgs = planetObserver.afterAddLink.firstCall.args;
      deepEqual(callbackArgs, [jupiter, 'moons', callisto], 'afterAddLink triggered with record, link and value');
    });

  }));
});

test("remove link from hasMany fires afterRemoveLink hook", function(){
  expect(1);
  stop();

  var jupiterDetails = {name: "Jupiter"};
  var moonDetails = {name: "callisto"};

  Ember.RSVP.all([
    store.add('planet', jupiterDetails),
    store.add('moon', moonDetails)

  ]).then(spread(function(jupiter, callisto){
    store.addLink('planet', jupiter.get('id'), 'moons', callisto.get('id')).then(function(){
      return store.removeLink('planet', jupiter.get('id'), 'moons', callisto.get('id'));

    }).then(function(){
      start();
      var callbackArgs = planetObserver.afterRemoveLink.firstCall.args;
      deepEqual(callbackArgs, [jupiter, 'moons', callisto], 'afterRemoveLink triggered with record, link and value');
    });

  }));
});

test("add link to hasOne fires afterAddLink hook", function(){
  expect(1);
  stop();

  var jupiterDetails = {name: "Jupiter"};
  var starDetails = {name: "The Sun"};

  Ember.RSVP.all([
    store.add('planet', jupiterDetails),
    store.add('star', starDetails)

  ]).then(spread(function(jupiter, sun){
    store.addLink('planet', jupiter.get('id'), 'sun', sun.get('id')).then(function(){
      start();
      var callbackArgs = planetObserver.afterAddLink.firstCall.args;
      deepEqual(callbackArgs, [jupiter, 'sun', sun], 'afterAddLink triggered with record, link and value');
    });

  }));
});

test("remove link from hasOne fires afterRemoveLink hook", function(){
  expect(1);
  stop();

  var jupiterDetails = {name: "Jupiter"};
  var starDetails = {name: "The Sun"};

  Ember.RSVP.all([
    store.add('planet', jupiterDetails),
    store.add('star', starDetails)

  ]).then(spread(function(jupiter, sun){
    store.addLink('planet', jupiter.get('id'), 'sun', sun.get('id')).then(function(){
      return store.removeLink('planet', jupiter.get('id'), 'sun', sun.get('id'));

    }).then(function(){
      start();
      var callbackArgs = planetObserver.afterRemoveLink.firstCall.args;
      deepEqual(callbackArgs, [jupiter, 'sun', sun], 'afterRemoveLink triggered with record, link and value');
    });

  }));
});
