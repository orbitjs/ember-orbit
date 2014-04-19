import Store from 'ember_orbit/store';

var createStore = function(options) {
  options = options || {};

  var container = new Ember.Container();
  container.register('store:main', Store);

  var store = container.lookup('store:main'),
      schema = store.get('schema');

  for (var prop in options) {
    container.register('model:' + prop, options[prop]);
    schema.defineModel(prop, options[prop]);
  }

  return store;
};

export { createStore };