import { computed } from '@ember/object';
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

  init() {
    this._super();
    Object.defineProperty(this, Symbol.iterator, {
      value: () => this.toArray()[Symbol.iterator]()
    });
  },

  content: computed(function() {
    return this.getContent();
  }),

  invalidate() {
    this.notifyPropertyChange('content');
  }
});
