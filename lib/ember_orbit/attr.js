var attr = function(type, options) {
  options = options || {};
  options.type = type;

  var meta = {
    options: options,
    isAttribute: true
  };

  return Ember.computed(function(key, value) {
    if (arguments.length > 1) {
      var oldValue = this.getAttribute(key);

      if (value !== oldValue) {
        this.patch(key, value);
      }

      return value;

    } else {
      return this.getAttribute(key);
    }
  }).meta(meta);
};

export default attr;
