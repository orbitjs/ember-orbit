import ReadOnlyArrayProxy from 'ember-orbit/system/read-only-array-proxy';

export default ReadOnlyArrayProxy.extend({
  _orbitCache: null,
  _query: null,
  _identityMap: null,

  init(...args) {
    console.debug('creating liveQuery', this);
    this.set('content', Ember.A());

    this._super(...args);

    const orbitCache = this.get('_orbitCache');
    const query = this.get('_query');
    const orbitLiveQuery = orbitCache.liveQuery(query);

    orbitLiveQuery.subscribe((operation) => {
      console.debug('liveQuery', operation);

      const handler = `_${operation.op}`;

      if (!this[handler]) return;

      Ember.run(() => {
        this[handler](operation);
      });
    });
  },

  _addRecord(operation) {
    const record = this._recordFor(operation);
    this.get('content').pushObject(record);
  },

  _removeRecord(operation) {
    const record = this._recordFor(operation);
    this.get('content').removeObject(record);
  },

  _recordFor(operation) {
    const identityMap = this.get('_identityMap');
    const { type, id } = operation.record;
    return identityMap.lookup({id, type});
  }
});
