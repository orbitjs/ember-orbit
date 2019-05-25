import ReadOnlyArrayProxy from '../system/read-only-array-proxy';

export default ReadOnlyArrayProxy.extend({
  pushObject(record) {
    return this.addToContent(record);
  },

  removeObject(record) {
    return this.removeFromContent(record);
  }
});
