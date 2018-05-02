import { computed } from '@ember/object';
export default function(model, options = {}) {
  options.type = 'hasMany';
  options.model = model;

  return computed({
    get(key) {
      return this.getRelatedRecords(key);
    }
  }).meta({
    options,
    isRelationship: true
  }).readOnly();
}
