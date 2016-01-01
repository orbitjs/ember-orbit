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
    return get(this, '_orbitCache').get([type, id]);
  },

  getAttribute(record, attribute) {
    const type = get(record.constructor, 'typeKey');
    const id = get(record, 'primaryId');

    return this.retrieve([type, id, 'attributes', attribute]);
  },

  getHasOne(record, relationship) {
    const type = get(record.constructor, 'typeKey');
    const id = get(record, 'primaryId');

    const value = this.retrieve([type, id, 'relationships', relationship, 'data']);
    if (!value) return null;

    return this.get('_identityMap').lookup(parseIdentifier(value));
  },

  liveQuery(query) {
    return new LiveQuery({
      _query: query,
      _orbitCache: this.get('_orbitCache'),
      _identityMap: this.get('_identityMap')
    });
  },
});
