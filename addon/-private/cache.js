import { assert } from '@ember/debug';
import EmberObject, { get } from '@ember/object';
import {
  buildQuery
} from '@orbit/data';
import { deepGet } from '@orbit/utils';
import LiveQuery from './live-query';

export default EmberObject.extend({
  _sourceCache: null,
  _identityMap: null,

  init(...args) {
    this._super.apply(this, ...args);

    assert(get(this, '_sourceCache'), '_sourceCache is required');
    assert(get(this, '_identityMap'), '_identityMap is required');
  },

  includesRecord(type, id) {
    return !!this.retrieveRecordData(type, id);
  },

  retrieveRecord(type, id) {
    if (this.includesRecord(type, id)) {
      return this._identityMap.lookup({type, id});
    }
  },

  retrieveRecordData(type, id) {
    return this._sourceCache.getRecordSync({ type, id });
  },

  retrieveKey(recordIdentity, key) {
    const record = this._sourceCache.getRecordSync(recordIdentity);
    return deepGet(record, ['keys', key]);
  },

  retrieveAttribute(recordIdentity, attribute) {
    const record = this._sourceCache.getRecordSync(recordIdentity);
    return deepGet(record, ['attributes', attribute]);
  },

  retrieveRelatedRecord(recordIdentity, relationship) {
    const record = this._sourceCache.getRecordSync(recordIdentity);
    if (record) {
      const value = deepGet(record, ['relationships', relationship, 'data']);
      if (!value) {
        return null;
      }

      return this._identityMap.lookup(value);
    }
  },

  unload(record) {
    // console.debug('unload', record);
    this._identityMap.evict(record);
  },

  query(queryOrExpression, options, id) {
    const query = buildQuery(queryOrExpression, options, id, this._sourceCache.queryBuilder);
    const result = this._sourceCache.query(query);

    switch(query.expression.op) {
      case 'findRecord':
      case 'findRelatedRecord':
        return this._identityMap.lookup(result);
      case 'findRecords':
      case 'findRelatedRecords':
        return this._identityMap.lookupMany(result);
      default:
        return result;
    }
  },

  liveQuery(queryOrExpression, options, id) {
    const query = buildQuery(queryOrExpression, options, id, this._sourceCache.queryBuilder);

    return LiveQuery.create({
      _query: query,
      _sourceCache: this._sourceCache,
      _identityMap: this._identityMap
    });
  },

  find(type, id, options) {
    if (id === undefined) {
      return this.findAll(type, options);
    } else {
      return this.findRecord(type, id, options);
    }
  },

  findAll(type, options) {
    return this.query(q => q.findRecords(type), options);
  },

  findRecord(type, id, options) {
    return this.query(q => q.findRecord({ type, id }), options);
  }
});
