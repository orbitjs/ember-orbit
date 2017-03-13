import Ember from 'ember';
import LiveQuery from '../live-query';
import { 
  QueryBuilder as qb,
  addToHasMany,
  removeFromHasMany
} from '@orbit/data';

const { get } = Ember;

export default LiveQuery.extend({
  _store: null,
  _model: null,
  _relationship: null,

  init(...args) {
    const store = get(this, '_store');
    const model = get(this, '_model');
    const relationship = get(this, '_relationship');

    this._orbitCache = store.cache._orbitCache;
    this._identityMap = store.cache._identityMap;
    this._query = qb.relatedRecords(model, relationship);

    this._super(...args);
  },

  pushObject(record) {
    const store = get(this, '_store');
    const model = get(this, '_model');
    const relationship = get(this, '_relationship');

    // console.log('pushObject', model.type, model.id, relationship, record.type, record.id);

    return store.update(addToHasMany(model.identity, relationship, record.identity));
  },

  removeObject(record) {
    const store = this.get('_store');
    const model = this.get('_model');
    const relationship = this.get('_relationship');

    return store.update(removeFromHasMany(model.identity, relationship, record.identity));
  }
});
