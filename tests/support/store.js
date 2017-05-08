import Ember from 'ember';
import { 
  Store,
  SchemaFactory,
  CoordinatorFactory,
  KeyMapFactory
} from 'ember-orbit';
import Owner from './owner';

export function createOwner() {
  const registry = new Ember.Registry();
  const owner = new Owner({ __registry__: registry});
  const container = registry.container({ owner });

  owner.__container__ = container;

  return owner;
}

export function createStore(options) {
  options = options || {};

  Ember.MODEL_FACTORY_INJECTIONS = !!options.MODEL_FACTORY_INJECTIONS;

  const owner = createOwner();

  owner.register('service:data-schema', SchemaFactory);
  owner.register('service:data-coordinator', CoordinatorFactory);
  owner.register('service:data-key-map', KeyMapFactory);
  owner.register('service:store', Store);

  owner.inject('service:store', 'schema', 'service:data-schema');
  owner.inject('service:store', 'coordinator', 'service:data-coordinator');
  owner.inject('service:store', 'keyMap', 'service:data-key-map');

  const models = options.models;
  if (models) {
    let types = [];
    Object.keys(models).forEach(type => {
      owner.register(`model:${type}`, models[type]);
      types.push(type);
    });

    // console.log(types);
    owner.register('model-names:main', types, { instantiate: false });
    owner.inject('service:data-schema', 'modelNames', 'model-names:main');
  }

  return owner.lookup('service:store');
}
