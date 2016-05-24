const { ArrayProxy } = Ember;

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
  unshiftObjects: notSupported
});
