import Ember from 'ember';

const {
  get,
  set,
  ArrayProxy
} = Ember;

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

  length: Ember.computed.alias('content.length'),

  init(...args) {
    let content = get(this, 'content');

    if (!content) {
      content = new Ember.A();
      set(this, 'content', content);
    }

    this._super(...args);
  }
});
