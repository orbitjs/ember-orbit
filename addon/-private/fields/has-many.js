export default function(model, options = {}) {
  options.type = 'hasMany';
  options.model = model;

  return Ember.computed({
    get(key) {
      return this.getHasMany(key);
    }
  }).meta({
    options,
    isRelationship: true
  }).readOnly();
}
