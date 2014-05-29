var getValue = function(record, key) {
  return record.context.getAttribute(record, key);
};

var setValue = function(record, key, value) {
  record.context.setAttribute(record, key, value);
};

var attr = function(type, options) {
  options = options || {};

  var meta = {
    type: type,
    options: options,
    isAttribute: true
  };

  return Ember.computed(function(key, value) {
    if (arguments.length > 1) {
      var oldValue = getValue(this, key);

      if (value !== oldValue) {
        setValue(this, key, value);
      }

      return value;

    } else {
      return getValue(this, key);
    }
  }).meta(meta);
};

export default attr;
