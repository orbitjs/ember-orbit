var get = Ember.get,
    set = Ember.set;

var getValue = function(record, key) {
  return record.context._source.retrieve([
    record.constructor.typeKey,
    record.__id__,
    key]
  );
};

var setValue = function(record, key, value) {
  record.context._source.patch(
    record.constructor.typeKey,
    record.__id__,
    key,
    value
  );
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
