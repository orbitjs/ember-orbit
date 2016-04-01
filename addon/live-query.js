import ReadOnlyArrayProxy from 'ember-orbit/system/read-only-array-proxy';
import Ember from 'ember';

const { get, set } = Ember;

export default ReadOnlyArrayProxy.extend({
  _orbitCache: null,
  _query: null,
  _identityMap: null,

  init(...args) {
    // console.debug('creating liveQuery', this);
    this._super(...args);

    set(this, 'content', Ember.A());

    const orbitLiveQuery = this._orbitCache.liveQuery(this._query);

    orbitLiveQuery.subscribe((operation) => {
      // console.debug('liveQuery', operation);

      const handler = `_${operation.op}`;

      if (!this[handler]) return;

      Ember.run(() => {
        this[handler](operation);
      });
    });
  },

  _addRecord(operation) {
    const record = this._recordFor(operation);
    get(this, 'content').pushObject(record);
  },

  _removeRecord(operation) {
    const record = this._recordFor(operation);
    get(this, 'content').removeObject(record);
  },

  _recordFor(operation) {
    return this._identityMap.lookup(operation.record);
  }
});
