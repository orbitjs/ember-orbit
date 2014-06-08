import Store from 'ember_orbit/store';

var get = Ember.get,
    set = Ember.set;

var createStore = function(options) {
  options = options || {};

  var container = new Ember.Container();
  container.register('store:main', Store);

  var store = container.lookup('store:main'),
      schema = get(store, 'schema');

  var models = options.models;
  if (models) {
    for (var prop in models) {
      container.register('model:' + prop, models[prop]);
      schema.defineModel(prop, models[prop]);
    }
  }

  return store;
};

export { createStore };