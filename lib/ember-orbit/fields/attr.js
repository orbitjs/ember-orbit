/**
 @module ember-orbit
 */

var attr = function(type, options) {
  options = options || {};
  options.type = type;

  return Ember.computed({
    get: function(key) {
      return this.getAttribute(key);
    },
    set: function(key, value) {
      var oldValue = this.getAttribute(key);

      if (value !== oldValue) {
        this.patch(key, value);
      }

      return value;
    }
  }).meta({
    options: options,
    isAttribute: true
  });
};

export default attr;
