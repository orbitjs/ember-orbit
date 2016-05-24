/**
 @module ember-orbit
 */

var hasMany = function(model, options) {
  options = options || {};
  options.type = 'hasMany';
  options.model = model;

  return Ember.computed({
    get: function(key) {
      return this.getHasMany(key);
    }
  }).meta({
    options: options,
    isRelationship: true
  }).readOnly();
};

export default hasMany;
