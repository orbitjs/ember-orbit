import { computed } from '@ember/object';

export default function(options: Record<string, unknown> = {}) {
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
