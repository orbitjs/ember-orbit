/**
 @module ember-orbit
 */

var key = function(type, options) {
  options = options || {};
  options.type = type;

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
