import { computed } from '@ember/object';

export default function(type: string, options: Record<string, unknown> = {}) {
  options.kind = 'hasMany';
  options.type = type;

  return computed({
    get(key) {
      return this.getRelatedRecords(key);
    }
  })
    .meta({
      options,
      isRelationship: true
    })
    .readOnly();
}
