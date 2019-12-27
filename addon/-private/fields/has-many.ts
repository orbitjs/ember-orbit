import { computed } from '@ember/object';
import { Dict } from '@orbit/utils';
import { RecordIdentity } from '@orbit/data';
import Orbit from '@orbit/core';
import { DEBUG } from '@glimmer/env';

import Model from '../model';

const { deprecate } = Orbit;

export default function(type: string, options: Dict<unknown> = {}) {
  options.kind = 'hasMany';
  options.type = type;

  return computed({
    get(this: Model, key): Model[] {
      let records = this.hasMany(key).value;

      if (DEBUG) {
        records = [...records];
      }

      const pushObject = (record: RecordIdentity) => {
        deprecate(
          '`HasMany#pushObject(record)` is deprecated, use `Model#hasMany(relationship).add(record)`.'
        );
        return this.hasMany(key).add(record);
      };
      const removeObject = (record: RecordIdentity) => {
        deprecate(
          '`HasMany#removeObject(record)` is deprecated, use `Model#hasMany(relationship).remove(record)`.'
        );
        return this.hasMany(key).remove(record);
      };

      Object.defineProperty(records, 'pushObject', { value: pushObject });
      Object.defineProperty(records, 'removeObject', { value: removeObject });

      if (DEBUG) {
        Object.freeze(records);
      }

      return records;
    }
  })
    .meta({
      options,
      isRelationship: true
    })
    .readOnly();
}
