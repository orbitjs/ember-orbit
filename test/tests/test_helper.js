import Store from 'ember_orbit/store';

var createStore = function(options) {
  options = options || {};

  var container = new Ember.Container();

  for (var prop in options) {
    container.register('model:' + prop, options[prop]);
  }

  container.register('store:main', Store.extend());

  return container.lookup('store:main');
};

export { createStore };