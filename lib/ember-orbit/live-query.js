import { operationType } from 'orbit-common/lib/operations';

export default Ember.ArrayProxy.extend({
  _orbitCache: null,
  _query: null,
  _identityMap: null,

  init() {
    this._super();

    const orbitCache = this.get('_orbitCache');
    const query = this.get('_query');

    this.set('content', []);

    const orbitLiveQuery = orbitCache.liveQuery(query);

    orbitLiveQuery.subscribe((operation) => {
      const handler = `_${operationType(operation)}`;

      if (!this[handler]) return;

      this[handler](operation);
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
    const [type, id] = operation.path;
    const record = identityMap.lookup({id, type});

    return record;
  }
});
