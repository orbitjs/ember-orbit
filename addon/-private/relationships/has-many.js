import Ember from 'ember';
import LiveQuery from '../live-query';

const { get } = Ember;

export default LiveQuery.extend({
  _store: null,
  _model: null,
  _relationship: null,

  init(...args) {
    const store = get(this, '_store');
    const model = get(this, '_model');
    const relationship = get(this, '_relationship');

    this._sourceCache = store.cache._sourceCache;
    this._identityMap = store.cache._identityMap;
    this._query = store.source.queryBuilder.findRelatedRecords(model, relationship);

    this._super(...args);
  },

  pushObject(record) {
    const store = get(this, '_store');
    const model = get(this, '_model');
    const relationship = get(this, '_relationship');

    // console.log('pushObject', model.type, model.id, relationship, record.type, record.id);

    return store.update(t => t.addToRelatedRecords(model.identity, relationship, record.identity));
  },

  removeObject(record) {
    const store = this.get('_store');
    const model = this.get('_model');
    const relationship = this.get('_relationship');

    return store.update(t => t.removeFromRelatedRecords(model.identity, relationship, record.identity));
  }
});
