import { computed } from '@ember/object';
import { Dict } from '@orbit/utils';

export default function(options: Dict<unknown> = {}) {
  options.type = 'string';

  return computed({
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
