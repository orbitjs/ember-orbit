/**
 @module ember-orbit
 */

var attr = function(type, options) {
  options = options || {};
  options.type = type;

  var meta = {
    options: options,
    isAttribute: true
  };

  return Ember.computed({
    get: function(key, value) {
      return this.getAttribute(key);
    }, set: function(key, value) {
      var oldValue = this.getAttribute(key);

      if (value !== oldValue) {
        this.patch(key, value);
      }

      return value;
    }
  }).meta(meta);
};

export default attr;
