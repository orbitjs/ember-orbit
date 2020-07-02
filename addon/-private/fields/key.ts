import { tracked } from '@glimmer/tracking';
import { KeyDefinition } from '@orbit/data';

import Model from '../model';

export default function key(target: Model, key: string);
export default function key(options?: KeyDefinition);
export default function key(options: Model | KeyDefinition = {}, _?: unknown) {
  function trackedKey(target: any, key: string, desc: PropertyDescriptor) {
    let trackedDesc = tracked(target, key, desc);
    let { get: originalGet, set: originalSet } = trackedDesc;

    let defaultAssigned = new WeakSet();

    function setDefaultValue(record: Model) {
      let value = record.getKey(key);
      setValue(record, value);
    }

    function setValue(record: Model, value: any) {
      defaultAssigned.add(record);
      return originalSet!.call(record, value);
    }

    function get(this: Model) {
      if (!defaultAssigned.has(this)) {
        setDefaultValue(this);
      }
      return originalGet!.call(this);
    }

    function set(this: Model, value: any) {
      const oldValue = this.getKey(key);

      if (value !== oldValue) {
        this.replaceKey(key, value);

        return setValue(this, value);
      }

      return value;
    }

    trackedDesc.get = get;
    trackedDesc.set = set;

    Reflect.defineMetadata('orbit:key', options, target, key);
    Reflect.defineMetadata(
      'orbit:notifier',
      (record: Model) => setDefaultValue(record),
      target,
      key
    );

    return trackedDesc;
  }

  if (arguments.length === 3) {
    options = {};
    return trackedKey.apply(null, arguments);
  }

  return trackedKey;
}
