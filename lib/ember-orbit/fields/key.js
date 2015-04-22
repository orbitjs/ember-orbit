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

  return Ember.computed({
    get: function(name, value) {
      return this.getKey(name);
    },
    set: function(name, value) {
      var oldValue = this.getKey(name);

      if (value !== oldValue) {
        this.patch(name, value);
      }

      return value;
    }
  }).meta(meta);
};

export default key;
