import Schema from 'ember-orbit/schema';
import Store from 'ember-orbit/store';
import Model from 'ember-orbit/model';
import attr from 'ember-orbit/fields/attr';
import hasOne from 'ember-orbit/fields/has-one';
import hasMany from 'ember-orbit/fields/has-many';
import { createStore } from 'tests/test-helper';
import Orbit from 'orbit/main';

var get = Ember.get,
    set = Ember.set;

var orbitListenerStub,
	store;

module("Integration - lifecycle callbacks", {
	setup: function(){
		var Star,
			Moon,
			Planet;

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

		orbitListenerStub = Ember.Object.extend(Ember.Evented, {
			onBeforeAdd: function(type, properties){
				console.log("onBeforeAdd", arguments);
				this.beforeAdd(type, properties);
			}.on("beforeAdd"),

			onAfterAdd: function(type, properties, result){
				this.afterAdd(type, properties, result);
			}.on("afterAdd"),			

			onAddRejected: function(type, properties, error){
				this.addRejected(type, properties, error);
			}.on("addRejected"),

			beforeAdd: sinon.spy(),
			afterAdd: sinon.spy(),
			addRejected: sinon.spy(),
		}).create();

		var LifecycleStore = Store.extend({
			listeners: [orbitListenerStub]
		});

		var container = new Ember.Container();
		container.register('schema:main', Schema);
		container.register('store:main', LifecycleStore);

		var models = {
			planet: Planet,
			moon: Moon,
			star: Star
		};

		if (models) {
			for (var prop in models) {
				container.register('model:' + prop, models[prop]);
			}
		}

		store = container.lookup('store:main');		
	}
});

test("beforeAdd is called before store.add", function(){
	stop();
	var earth = {name: 'Earth'};
	store.add('planet', earth).then(function() {
		start();
		ok(orbitListenerStub.beforeAdd.calledWith('planet', earth));
	});
});

test("afterAdd is called after store.add", function(){
	stop();
	var earth = {name: 'Earth'};
	store.add('planet', earth).then(function(planet) {
		start();

		var callArgs = orbitListenerStub.afterAdd.getCall(0).args;
		equal(callArgs[0], 'planet');
		equal(callArgs[1], earth);
		equal(callArgs[2].get("name"), "Earth");
	});
});

test("addRejected is called when store.add is rejected", function(){
	stop();

	var earth = {name: 'Earth'};
	store.orbitSource.add = function(){
		return Ember.RSVP.reject("add rejected");
	};

	store.add('planet', earth).catch(function() {
		start();

		var callArgs = orbitListenerStub.addRejected.getCall(0).args;
		equal(callArgs[0], 'planet');
		equal(callArgs[1], earth);
		equal(callArgs[2], "add rejected");
	});
});
