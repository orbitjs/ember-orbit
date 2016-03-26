const get = Ember.get;

import LiveQuery from 'ember-orbit/live-query';
import { parseIdentifier } from 'orbit-common/lib/identifiers';

export default Ember.Object.extend({
  _orbitCache: null,
  _identityMap: null,

  init(...args) {
    this._super.apply(this, ...args);

    Ember.assert(get(this, '_orbitCache'), '_orbitCache is required');
    Ember.assert(get(this, '_identityMap'), '_identityMap is required');
  },

  retrieve(path) {
    return get(this, '_orbitCache').get(path);
  },

  retrieveRecord(type, id) {
    return this.get('_identityMap').lookup({type, id});
  },

  retrieveKey(record, key) {
    const type = get(record.constructor, 'typeKey');
    const id = get(record, 'id');

    return this.retrieve([type, id, 'keys', key]);
  },

  retrieveAttribute(record, attribute) {
    const type = get(record.constructor, 'typeKey');
    const id = get(record, 'id');

    return this.retrieve([type, id, 'attributes', attribute]);
  },

  retrieveHasOne(record, relationship) {
    const type = get(record.constructor, 'typeKey');
    const id = get(record, 'id');

    const value = this.retrieve([type, id, 'relationships', relationship, 'data']);
    if (!value) return null;

    return this.get('_identityMap').lookup(parseIdentifier(value));
  },

  unload(record) {
    console.debug('unload', record);
    this.get('_identityMap').evict(record);
  },

  liveQuery(query) {
    return LiveQuery.create({
      _query: query,
      _orbitCache: this.get('_orbitCache'),
      _identityMap: this.get('_identityMap')
    });
  },
});
