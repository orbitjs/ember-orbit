import { computed } from '@ember/object';
import { Dict } from '@orbit/utils';

export default function (type: string, options: Dict<unknown> = {}) {
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
