export default function(type, options = {}) {
  options.type = type;

  return Ember.computed({
    get(key) {
      return this.getAttribute(key);
    },
    set(key, value) {
      const oldValue = this.getAttribute(key);

      if (value !== oldValue) {
        this.replaceAttribute(key, value);
      }

      return value;
    }
  }).meta({
    options,
    isAttribute: true
  });
}