import Schema from 'ember-orbit/schema';
import Store from 'ember-orbit/store';

var createStore = function(options) {
  options = options || {};

  Ember.MODEL_FACTORY_INJECTIONS = !!options.MODEL_FACTORY_INJECTIONS;

  var registry = new Ember.Registry();
  var container = registry.container();
  registry.register('schema:main', Schema);
  registry.register('store:main', Store);

  var models = options.models;
  if (models) {
    for (var prop in models) {
      registry.register('model:' + prop, models[prop]);
    }
  }

  return container.lookup('store:main');
};

export { createStore };
