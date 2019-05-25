import { computed } from '@ember/object';

export default function(type: string, options: Record<string, unknown> = {}) {
  options.kind = 'hasOne';
  options.type = type;

  return computed({
    get(key) {
      return this.getRelatedRecord(key);
    },
    set(key, value) {
      const oldValue = this.getRelatedRecord(key);

      if (value !== oldValue) {
        this.replaceRelatedRecord(key, value);
      }

      return value;
    }
  }).meta({
    options,
    isRelationship: true
  });
}
