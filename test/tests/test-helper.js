import Schema from 'ember-orbit/schema';
import Store from 'ember-orbit/store';

var get = Ember.get,
    set = Ember.set;

var createStore = function(options) {
  options = options || {};

  var container = new Ember.Container();
  container.register('schema:main', Schema);
  container.register('store:main', Store);

  var models = options.models;
  if (models) {
    for (var prop in models) {
      container.register('model:' + prop, models[prop]);
    }
  }

  return container.lookup('store:main');
};

export { createStore };