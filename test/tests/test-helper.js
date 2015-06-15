import Schema from 'ember-orbit/schema';
import Store from 'ember-orbit/store';

var createStore = function(options) {
  options = options || {};

  var container = new Ember.Container();
  container._registry.register('schema:main', Schema);
  container._registry.register('store:main', Store);

  var models = options.models;
  if (models) {
    for (var prop in models) {
      container.register('model:' + prop, models[prop]);
    }
  }

  return container.lookup('store:main');
};

export { createStore };
