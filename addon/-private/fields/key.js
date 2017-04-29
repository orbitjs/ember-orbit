export default function(options = {}) {
  options.type = 'string';

  return Ember.computed({
    get(name) {
      return this.getKey(name);
    },
    set(name, value) {
      const oldValue = this.getKey(name);

      if (value !== oldValue) {
        this.replaceKey(name, value);
      }

      return value;
    }
  }).meta({
    options,
    isKey: true
  });
}
