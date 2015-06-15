/**
 @module ember-orbit
 */

var hasMany = function(model, options) {
  options = options || {};
  options.type = 'hasMany';
  options.model = model;

  return Ember.computed({
    get: function(key) {
      return this.getLinks(key);
    }
  }).meta({
    options: options,
    isLink: true
  }).readOnly();
};

export default hasMany;
