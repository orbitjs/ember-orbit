import Store from 'ember-orbit/store';
import OrbitStore from 'orbit-common/store';
import OrbitSchema from 'orbit-common/schema';

var createStore = function(options) {
  options = options || {};

  Ember.MODEL_FACTORY_INJECTIONS = !!options.MODEL_FACTORY_INJECTIONS;

  const registry = new Ember.Registry();
  const container = registry.container();

  const orbitSchema = new OrbitSchema();
  const orbitStore = new OrbitStore({ schema: orbitSchema });
  registry.register('service:orbitStore', orbitStore, { instantiate: false });
  registry.register('store:main', Store);

  const models = options.models;
  if (models) {
    for (let prop in models) {
      registry.register('model:' + prop, models[prop]);
    }
  }
  const store =  container.lookup('store:main');
  return store;
};

export { createStore };
