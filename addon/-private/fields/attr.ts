import { AttributeDefinition } from '@orbit/data';

import Model from '../model';
import { getAttributeCache } from '../utils/property-cache';
import { defineAttribute } from '../utils/model-definition';

export default function attr(target: Model, key: string);
export default function attr(type?: string, options?: AttributeDefinition);
export default function attr(
  type?: Model | string,
  options: string | AttributeDefinition = {}
) {
  function trackedAttr(target: any, property: string, _: PropertyDescriptor) {
    function get(this: Model) {
      if (!this.disconnected) {
        return getAttributeCache(this, property).value;
      }
    }

    function set(this: Model, value: any) {
      const oldValue = this.getAttribute(property);

      if (value !== oldValue) {
        this.assertMutableFields();
        this.replaceAttribute(property, value).catch(() =>
          getAttributeCache(this, property).notifyPropertyChange()
        );
        getAttributeCache(this, property).value = value;
      }
    }

    defineAttribute(target, property, options as AttributeDefinition);

    return { get, set };
  }

  if (typeof options === 'string') {
    options = {};
    return trackedAttr.apply(null, arguments);
  }

  options.type = type as string;
  return trackedAttr;
}
