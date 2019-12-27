import { computed } from '@ember/object';
import { Dict } from '@orbit/utils';

import Model from '../model';

export default function(type: string, options: Dict<unknown> = {}) {
  options.kind = 'hasOne';
  options.type = type;

  return computed({
    get(this: Model, key) {
      return this.hasOne(key).value;
    },
    set(this: Model, key, value: Model | null) {
      const oldValue = this.hasOne(key).value;

      if (value !== oldValue) {
        this.hasOne(key).replace(value);
      }

      return value;
    }
  }).meta({
    options,
    isRelationship: true
  });
}
