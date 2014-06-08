var hasOne = function(model, options) {
  options = options || {};
  options.type = 'hasOne';
  options.model = model;

  var meta = {
    options: options,
    isLink: true
  };

  return Ember.computed(function(key, value) {
    var proxy = this.context.getLink(this, key);

    if (arguments.length > 1) {
      if (value !== proxy.get('content')) {
        proxy.setProperties({
          content: value,
          promise: this.context.setLink(this, key, value)
        });
      }
    }

    return proxy;

  }).meta(meta);
};

export default hasOne;
