/**
 @module ember-orbit
 */

var hasMany = function(model, options) {
  options = options || {};
  options.type = 'hasMany';
  options.model = model;

  var meta = {
    options: options,
    isLink: true
  };

  return Ember.computed(function(key) {
    return this.getLinks(key);
  }).meta(meta).readOnly();
};

export default hasMany;
