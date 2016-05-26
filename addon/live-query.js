import Ember from 'ember';
import ReadOnlyArrayProxy from 'ember-orbit/system/read-only-array-proxy';

const { get, set } = Ember;

export default ReadOnlyArrayProxy.extend({
  _orbitCache: null,
  _query: null,
  _identityMap: null,
  _orbitLiveQuery: null,

  init(...args) {
    this._super(...args);

    // console.debug('creating liveQuery', this);

    const orbitLiveQuery = this._orbitCache.liveQuery(this._query);

    set(this, '_orbitLiveQuery', orbitLiveQuery);

    orbitLiveQuery.subscribe((operation) => {
      // console.debug('liveQuery', operation);

      const handler = this._operations[operation.op];

      if (handler) {
        Ember.run(() => {
          // console.debug('liveQuery.content - before', get(this, 'content'));
          handler.call(this, operation);
          // console.debug('liveQuery.content - after', get(this, 'content'));
        });
      }
    });
  },

  _operations: {
    addRecord(operation) {
      const record = this._recordFor(operation);
      get(this, 'content').pushObject(record);
    },

    removeRecord(operation) {
      const record = this._recordFor(operation);
      get(this, 'content').removeObject(record);
    },
  },

  _recordFor(operation) {
    return this._identityMap.lookup(operation.record);
  }
});
