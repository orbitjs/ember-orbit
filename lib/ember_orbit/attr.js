var get = Ember.get;

var getValue = function(record, key) {

};

var setValue = function(record, key, value) {

};

var attr = function(type, options) {
  options = options || {};

  var meta = {
    type: type,
    options: options,
    isAttribute: true
  };

  return Ember.computed('data', function(key, value) {
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
