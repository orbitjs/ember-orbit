import ReadOnlyArrayProxy from './system/read-only-array-proxy';

export default ReadOnlyArrayProxy.extend({
  willDestroy() {
    this._liveQuerySet.delete(this);
  }
});
