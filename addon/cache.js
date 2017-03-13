import { 
  deserializeRecordIdentity,
  Query,
  QueryBuilder as qb
} from '@orbit/data';
import { deepGet } from '@orbit/utils';
import LiveQuery from 'ember-orbit/live-query';
import objectValues from 'ember-orbit/utils/object-values';

const { get } = Ember;

export default Ember.Object.extend({
  _orbitCache: null,
  _identityMap: null,

  init(...args) {
    this._super.apply(this, ...args);

    Ember.assert(get(this, '_orbitCache'), '_orbitCache is required');
    Ember.assert(get(this, '_identityMap'), '_identityMap is required');
  },

  includesRecord(type, id) {
    return !!this._orbitCache.records(type).get(id);
  },

  retrieveRecord(type, id) {
    if (this.includesRecord(type, id)) {
      return this._identityMap.lookup({type, id});
    }
  },

  retrieveKey(recordIdentity, key) {
    const record = this._orbitCache.records(recordIdentity.type).get(recordIdentity.id);
    return deepGet(record, ['keys', key]);
  },

  retrieveAttribute(recordIdentity, attribute) {
    const record = this._orbitCache.records(recordIdentity.type).get(recordIdentity.id);
    return deepGet(record, ['attributes', attribute]);
  },

  retrieveHasOne(recordIdentity, relationship) {
    const record = this._orbitCache.records(recordIdentity.type).get(recordIdentity.id);
    if (record) {
      const value = deepGet(record, ['relationships', relationship, 'data']);
      if (!value) {
        return null;
      }

      return this._identityMap.lookup(deserializeRecordIdentity(value));
    }
  },

  unload(record) {
    // console.debug('unload', record);
    this._identityMap.evict(record);
  },

  query(queryOrExpression, options) {
    const query = Query.from(queryOrExpression, options);
    const result = this._orbitCache.query(query);

    switch(query.expression.op) {
      case 'record':
      case 'relatedRecord':
        return this._identityMap.lookup(result);
      case 'records':
      case 'relatedRecords':
      case 'filter':
        return this._identityMap.lookupMany(objectValues(result));
      default:
        return result;
    }
  },

  liveQuery(queryOrExpression, options) {
    const query = Query.from(queryOrExpression, options);

    return LiveQuery.create({
      _query: query,
      _orbitCache: this._orbitCache,
      _identityMap: this._identityMap
    });
  },

  find(type, id, options) {
    if (id === undefined) {
      return this.query(qb.records(type), options);
    } else {
      return this.query(qb.record({type, id}), options);
    }
  }
});
