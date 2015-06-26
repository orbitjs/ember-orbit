/**
 @module ember-orbit
 */

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
      var currentValue = this.getLink(key);

      if (currentValue !== value) {
        if (value === undefined) {
          this.removeLink(key, currentValue);
        } else {
          this.addLink(key, value);
        }
      }

      return value;
    }
  }).meta(meta);

};

export default hasOne;
