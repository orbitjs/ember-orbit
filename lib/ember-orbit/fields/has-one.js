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

  return Ember.computed({
    get: function(key) {
      return this.getLink(key);
    },
    set: function(key, value) {
      var proxy = this.getLink(key),
          currentValue = get(proxy, 'content');

      if (value === null) {
        value = undefined;
      }

      if (currentValue !== value) {
        if (value === undefined) {
          this.removeLink(key, currentValue);
        } else {
          this.addLink(key, value);
        }
        set(proxy, 'content', value);
      }

      return proxy;
    }
  }).meta(meta);

};

export default hasOne;
