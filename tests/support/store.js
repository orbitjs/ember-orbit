import Ember from 'ember';
import Store from 'ember-orbit/store';
import Schema from 'ember-orbit/schema';
import KeyMap from 'ember-orbit/key-map';
import Owner from './owner';

function createOwner() {
  const registry = new Ember.Registry();
  const owner = new Owner({ __registry__: registry});
  const container = registry.container({ owner });

  owner.__container__ = container;

  return owner;
}

function createStore(options) {
  options = options || {};

  Ember.MODEL_FACTORY_INJECTIONS = !!options.MODEL_FACTORY_INJECTIONS;

  const owner = createOwner();

  owner.register('data-schema:main', Schema);
  owner.register('data-key-map:main', KeyMap);
  owner.register('service:store', Store);
  owner.inject('service:store', 'schema', 'data-schema:main');
  owner.inject('service:store', 'keyMap', 'data-key-map:main');

  const models = options.models;
  if (models) {
    for (let prop in models) {
      owner.register('model:' + prop, models[prop]);
    }
  }

  const store = owner.lookup('service:store');
  const schema = store.schema;

  if (models) {
    for (let model in models) {
      schema.modelFor(model);
    }
  }

  return store;
}

export { createOwner, createStore };
