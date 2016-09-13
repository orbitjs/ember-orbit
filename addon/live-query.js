import Ember from 'ember';
import ReadOnlyArrayProxy from 'ember-orbit/system/read-only-array-proxy';
import { toIdentifier } from 'orbit/lib/identifiers';

const { get, set } = Ember;

export default ReadOnlyArrayProxy.extend({
  _orbitCache: null,
  _query: null,
  _identityMap: null,
  _orbitLiveQuery: null,
  _contentMap: null,

  init(...args) {
    this._super(...args);

    // console.debug('creating liveQuery', this);

    const orbitLiveQuery = this._orbitCache.liveQuery(this._query);

    set(this, '_orbitLiveQuery', orbitLiveQuery);
    set(this, '_contentMap', {});

    orbitLiveQuery.subscribe((operation) => {
      // console.debug('liveQuery - operation', operation);

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
      const identity = operation.record;
      const identifier = toIdentifier(identity);
      if (!this._contentMap[identifier]) {
        const record = this._identityMap.lookup(identity);
        this._contentMap[identifier] = record;

        const content = get(this, 'content');
        content.pushObject(record);
      }
    },

    replaceRecord(operation) {
      const identity = operation.record;
      const identifier = toIdentifier(identity);
      if (!this._contentMap[identifier]) {
        const record = this._identityMap.lookup(identity);
        this._contentMap[identifier] = record;

        const content = get(this, 'content');
        content.pushObject(record);
      }
    },

    removeRecord(operation) {
      const identity = operation.record;
      const identifier = toIdentifier(identity);
      if (this._contentMap[identifier]) {
        const record = this._contentMap[identifier];
        delete this._contentMap[identifier];

        const content = get(this, 'content');
        content.removeObject(record);
      }
    }
  }
});
