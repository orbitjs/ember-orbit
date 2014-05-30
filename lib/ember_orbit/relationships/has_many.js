var getValue = function(record, key) {
  return record.context.getLinks(record, key);
};

var setValue = function(record, key, value) {
  record.context.setLinks(record, key, value);
};

var hasMany = function(model, options) {
  options = options || {};
  options.type = 'hasMany';
  options.model = model;

  var meta = {
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
