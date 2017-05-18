import Ember from 'ember';
import {
  Store,
  SchemaFactory,
  StoreFactory,
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

  owner.register('data-schema:main', SchemaFactory);
  owner.register('data-key-map:main', KeyMapFactory);

  owner.register('data-source:store', StoreFactory);
  owner.register('service:store', Store);
  owner.inject('service:store', 'source', 'data-source:store');

  owner.inject('data-source', 'schema', 'data-schema:main');
  owner.inject('data-source', 'keyMap', 'data-key-map:main');

  const models = options.models;
  if (models) {
    let types = [];
    Object.keys(models).forEach(type => {
      owner.register(`model:${type}`, models[type]);
      types.push(type);
    });

    // console.log(types);
    owner.register('model-names:main', types, { instantiate: false });
    owner.inject('data-schema:main', 'modelNames', 'model-names:main');
  }

  return owner.lookup('service:store');
}
