import { computed } from '@ember/object';
import { Dict } from '@orbit/utils';

import Model from '../model';

export default function(type: string, options: Dict<unknown> = {}) {
  options.type = type;

  return computed({
    get(this: Model, key) {
      return this.getAttribute(key);
    },
    set(this: Model, key, value) {
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
