/**
 @module ember-orbit
 */

var get = Ember.get,
    set = Ember.set;

var hasOne = function(model, options) {
  options = options || {};
  options.type = 'hasOne';
  options.model = model;

  var meta = {
    options: options,
    isLink: true
  };

  return Ember.computed(function(key, value) {
    var proxy = this.getLink(key);

    if (arguments.length > 1) {
      if('undefined' === typeof(value) || value===null){
        proxy.setProperties({
          promise: this.removeLink(key, get(proxy, 'content'))
        });
      }else if (value !== get(proxy, 'content')) {
        proxy.setProperties({
          content: value,
          promise: this.addLink(key, value)
        });
      }
    }

    return proxy;

  }).meta(meta);
};

export default hasOne;
