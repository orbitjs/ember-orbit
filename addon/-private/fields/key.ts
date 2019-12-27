import { computed } from '@ember/object';
import { Dict } from '@orbit/utils';

import Model from '../model';

export default function(options: Dict<unknown> = {}) {
  options.type = 'string';

  return computed({
    get(this: Model, name) {
      return this.getKey(name);
    },
    set(this: Model, name, value: string) {
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
