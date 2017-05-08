export default function(model, options = {}) {
  options.type = 'hasOne';
  options.model = model;

  return Ember.computed({
    get(key) {
      return this.getHasOne(key);
    },
    set(key, value) {
      const oldValue = this.getHasOne(key);

      if (value !== oldValue) {
        this.replaceHasOne(key, value);
      }

      return value;
    }
  }).meta({
    options,
    isRelationship: true
  });
}
