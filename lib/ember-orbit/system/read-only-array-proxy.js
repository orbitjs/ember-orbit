const { ArrayProxy } = Ember;

export default ArrayProxy.extend({
  addObject() {
    throw new Error('not supported');
  },

  clear() {
    throw new Error('not supported');
  },

  insertAt() {
    throw new Error('not supported');
  },

  popObject() {
    throw new Error('not supported');
  },

  pushObject() {
    throw new Error('not supported');
  },

  pushObjects() {
    throw new Error('not supported');
  },

  removeAt() {
    throw new Error('not supported');
  },

  removeObject() {
    throw new Error('not supported');
  },

  replace() {
    throw new Error('not supported');
  },

  reverseObjects() {
    throw new Error('not supported');
  },

  setObjects() {
    throw new Error('not supported');
  },

  shiftObject() {
    throw new Error('not supported');
  },

  unshiftObject() {
    throw new Error('not supported');
  },

  unshiftObjects() {
    throw new Error('not supported');
  }
});
