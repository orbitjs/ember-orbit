/**
 @module ember-orbit
 */

var key = function(type, options) {
  if (arguments.length === 1 && typeof type === 'object') {
    options = type;
    type = null; // use default below
  }

  options = options || {};
  options.type = type || 'string';

  var meta = {
    options: options,
    isKey: true
  };

  return Ember.computed(function(name, value) {
    if (arguments.length > 1) {
      var oldValue = this.getKey(name);

      if (value !== oldValue) {
        this.patch(name, value);
      }

      return value;

    } else {
      return this.getKey(name);
    }
  }).meta(meta);
};

export default key;
