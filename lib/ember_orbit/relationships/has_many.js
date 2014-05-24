var getValue = function(record, key) {

};

var setValue = function(record, key, value) {

};

var hasMany = function(type, options) {
  options = options || {};

  options.hasOne = true;

  var meta = {
    type: type,
    options: options,
    isLink: true
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

export default hasMany;
