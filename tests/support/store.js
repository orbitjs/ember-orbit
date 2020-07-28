import Ember from 'ember';
import { initialize as initializeConfig } from 'ember-orbit/initializers/ember-orbit-config';
import { initialize as initializeServices } from 'ember-orbit/initializers/ember-orbit-services';
import Owner from './owner';

export function createOwner() {
  const registry = new Ember.Registry();
  const owner = Owner.create({ __registry__: registry });
  const container = registry.container({ owner });

  owner.__container__ = container;

  return owner;
}

export function createStore(options) {
  options = options || {};

  const owner = options.owner || createOwner();
  initializeConfig(owner);
  initializeServices(owner);
  let orbitConfig = owner.lookup('ember-orbit:config');
  orbitConfig.createModelsFromSchema = true;

  const { models } = options;
  if (models) {
    let types = [];
    Object.keys(models).forEach((type) => {
      owner.register(`${orbitConfig.types.model}:${type}`, models[type]);
      types.push(type);
    });

    owner.register('ember-orbit-model-names:main', types, {
      instantiate: false
    });
    owner.inject(
      `service:${orbitConfig.services.schema}`,
      'modelNames',
      'ember-orbit-model-names:main'
    );
  }

  return owner.lookup(`service:${orbitConfig.services.store}`);
}
