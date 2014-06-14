import Schema from 'ember_orbit/schema';
import Context from 'ember_orbit/context';

var get = Ember.get,
    set = Ember.set;

var createContext = function(options) {
  options = options || {};

  var container = new Ember.Container();
  container.register('schema:main', Schema);
  container.register('context:main', Context);

  var models = options.models;
  if (models) {
    for (var prop in models) {
      container.register('model:' + prop, models[prop]);
    }
  }

  return container.lookup('context:main');
};

export { createContext };