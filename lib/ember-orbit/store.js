import Schema from 'ember-orbit/schema';
import Cache from 'ember-orbit/cache';
import IdentityMap from 'ember-orbit/identity-map';
import { operationType } from 'orbit-common/lib/operations';

/**
 @module ember-orbit
 */

const get = Ember.get;

var Store = Ember.Object.extend({
  orbitStore: Ember.inject.service('orbitStore'),
  schema: null,
  cache: null,

  init: function() {
    this._super.apply(this, arguments);

    const { orbitStore, container } = this.getProperties('orbitStore', 'container');

    Ember.assert(get(this, 'orbitStore'), 'orbitStore is required');

    this._requests = Ember.OrderedSet.create();

    const orbitCache = orbitStore.cache;

    const schema = Schema.create({ container, _orbitSchema: orbitStore.schema });
    this._identityMap = IdentityMap.create({ _schema: schema, _orbitCache: orbitCache, _store: this });
    const cache = Cache.create({ _orbitCache: orbitCache, _identityMap: this._identityMap });

    this.setProperties({ schema, cache });

    orbitCache.on('patch', this._didPatch, this);
  },

  // then: function(success, failure) {
  //   return this.settleRequests().then(success, failure);
  // },

  // settleRequests: function() {
  //   return Ember.RSVP.all(this._requests.toArray());
  // },

  settleTransforms: function() {
    return this.get('orbitStore').settleTransforms();
  },

  willDestroy: function() {
    get(this, 'orbitStore').off('didTransform', this.didTransform, this);
    // this._recordArrayManager.destroy();
    this._super.apply(this, arguments);
  },

  // query: function(type, query, options) {
  //   var _this = this;
  //   this._verifyType(type);

  //   var promise = this.orbitSource.query(type, query, options).then(function(data) {
  //     return _this._lookupFromData(type, data);
  //   });

  //   return this._request(promise);
  // },

  addRecord(properties = {}) {
    const { schema, orbitStore } = this.getProperties('schema', 'orbitStore');

    this._verifyType(properties.type);

    const normalizedProperties = schema.normalize(properties);
    return orbitStore.addRecord(normalizedProperties).then(data => {
      return this._identityMap.lookup(data);
    });
  },

  findRecord(type, id) {
    return this.get('orbitStore')
      .findRecord(type, id)
      .then(record => this._identityMap.lookup(record));
  },

  removeRecord(record) {
    const identifier = this._identityMap.identifier(record);
    return this.get('orbitStore').removeRecord(identifier);
  },

  replaceAttribute(record, attribute, value) {
    const identifier = this._identityMap.identifier(record);
    return this.get('orbitStore').replaceAttribute(identifier, attribute, value);
  },

  addToHasMany(record, relationship, value) {
    const recordIdentifier = this._identityMap.identifier(record);
    const valueIdentifier = this._identityMap.identifier(value);

    return this.get('orbitStore').addToHasMany(recordIdentifier, relationship, valueIdentifier);
  },

  removeFromHasMany(record, relationship, value) {
    const recordIdentifier = this._identityMap.identifier(record);
    const valueIdentifier = this._identityMap.identifier(value);

    return this.get('orbitStore').removeFromHasMany(recordIdentifier, relationship, valueIdentifier);
  },

  replaceHasOne(record, relationship, value) {
    const recordIdentifier = this._identityMap.identifier(record);
    const valueIdentifier = value && this._identityMap.identifier(value);

    return this.get('orbitStore').replaceHasOne(recordIdentifier, relationship, valueIdentifier);
  },

  unload: function(record) {
    this.get('_identityMap').evict(record);
  },

  _verifyType(type) {
    Ember.assert("`type` must be registered as a model in the container", get(this, 'schema').modelFor(type));
  },

  _didPatch: function(operation) {
    console.log('didPatch', operation);
    const { path } = operation;
    const record = this._identityMap.lookup({type: path[0], id: path[1]});

    switch(operationType(operation)) {
      case 'replaceAttribute': return record.propertyDidChange(path[3]);
      case 'replaceHasOne': return record.propertyDidChange(path[3]);
    }
  },

  _request(promise) {
    const requests = this._requests;
    requests.add(promise);

    return promise.finally(function() {
      requests.delete(promise);
    });
  },

  _normalizeId(id) {
    if (id !== null && typeof id === 'object') {
      return id.primaryId;
    } else {
      return id;
    }
  }
});

export default Store;
