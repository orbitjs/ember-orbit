import { A } from '@ember/array';
import { alias } from '@ember/object/computed';
import { set, get } from '@ember/object';
import ArrayProxy from '@ember/array/proxy';

function notSupported() {
  throw new Error('Method not supported on read-only ArrayProxy.');
}

export default ArrayProxy.extend({
  addObject: notSupported,
  clear: notSupported,
  insertAt: notSupported,
  popObject: notSupported,
  pushObject: notSupported,
  pushObjects: notSupported,
  removeAt: notSupported,
  removeObject: notSupported,
  replace: notSupported,
  reverseObjects: notSupported,
  setObjects: notSupported,
  shiftObject: notSupported,
  unshiftObject: notSupported,
  unshiftObjects: notSupported,

  length: alias('content.length'),

  init(...args) {
    let content = get(this, 'content');

    if (!content) {
      content = new A();
      set(this, 'content', content);
    }

    this._super(...args);
  }
});
