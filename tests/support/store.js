import Ember from 'ember';
import Store from 'ember-orbit/store';
import OrbitStore from 'orbit-common/store';
import OrbitSchema from 'orbit-common/schema';
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

  const orbitSchema = new OrbitSchema();
  const orbitStore = new OrbitStore({ schema: orbitSchema });

  owner.register('service:orbitStore', orbitStore, { instantiate: false });
  owner.register('store:main', Store);

  const models = options.models;
  if (models) {
    for (let prop in models) {
      owner.register('model:' + prop, models[prop]);
    }
  }

  const store = owner.lookup('store:main');
  const schema = store.get('schema');

  if (models) {
    for (let model in models) {
      schema.modelFor(model);
    }
  }

  return store;
}

export { createOwner, createStore };
