import Ember from 'ember';
import Store from 'ember-orbit/store';
import Schema from 'ember-orbit/schema';
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

  owner.register('schema:main', Schema);
  owner.register('store:main', Store);
  owner.inject('store', 'schema', 'schema:main');

  const models = options.models;
  if (models) {
    for (let prop in models) {
      owner.register('model:' + prop, models[prop]);
    }
  }

  const store = owner.lookup('store:main');
  const schema = store.schema;

  if (models) {
    for (let model in models) {
      schema.modelFor(model);
    }
  }

  return store;
}

export { createOwner, createStore };
