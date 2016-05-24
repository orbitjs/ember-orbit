/**
 @module ember-orbit
 */

var hasOne = function(model, options) {
  options = options || {};
  options.type = 'hasOne';
  options.model = model;

  const meta = {
    options: options,
    isRelationship: true
  };

  return Ember.computed({
    get: function(key) {
      return this.getHasOne(key);
    },
    set: function(key, value) {
      const oldValue = this.getHasOne(key);

      if (value !== oldValue) {
        this.replaceHasOne(key, value);
      }

      return value;
    }
  }).meta(meta);

};

export default hasOne;
