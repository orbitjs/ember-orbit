import Schema from 'ember-orbit/schema';
import Cache from 'ember-orbit/cache';
import IdentityMap from 'ember-orbit/identity-map';
import OrbitStore from 'orbit-common/store';

/**
 @module ember-orbit
 */

const {
  assert,
  get,
  getOwner,
  RSVP
} = Ember;

class PromiseTracker {
  constructor() {
    this._pending = [];
    this._reset();
  }

  track(promise) {
    console.debug('tracking', promise);
    this._pending.push(promise);

    return promise.finally(result => this._fulfill(promise));
  }

  fulfillAll() {
    return this._onEmpty.promise.tap(() => console.debug('fulfillAll'));
  }

  _reset() {
    this._onEmpty = RSVP.defer();
  }

  _fulfill(promise) {
    console.debug('fulfilled', promise);
    this._remove(promise);

    if (this._pending.length === 0) {
      this._onEmpty.resolve();
      this._reset();
    }
  }

  _remove(promise) {
    const index = this._pending.indexOf(promise);
    this._pending.splice(index, 1);
  }
}

export default Ember.Object.extend({
  orbitStore: null,
  schema: null,
  cache: null,
  _identityMap: null,

  init() {
    this._super(...arguments);

    assert("`schema` must be injected onto a Store", this.schema);

    if (!this.orbitStore) {
      this.orbitStore = new OrbitStore({ schema: this.schema.orbitSchema });
    }

    const orbitCache = this.orbitStore.cache;

    this._identityMap = IdentityMap.create({ _schema: this.schema, _orbitCache: orbitCache, _store: this });
    this.cache = Cache.create({ _orbitCache: orbitCache, _identityMap: this._identityMap });

    orbitCache.patches.subscribe(operation => this._didPatch(operation));
    this._transformTracker = new PromiseTracker();
  },

  then: function(success, error) {
    return this._transformTracker.fulfillAll().tap(() => console.debug('then')).then(success, error);
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

  transform(...args) {
    const orbitStore = this.get('orbitStore');
    const transformTracker = this.get('_transformTracker');

    const promisedTransform = orbitStore.transform(...args);
    transformTracker.track(promisedTransform);

    return promisedTransform;
  },

  addRecord(properties = {}) {
    const { schema, orbitStore } = this.getProperties('schema', 'orbitStore');

    this._verifyType(properties.type);

    const normalizedProperties = schema.normalize(properties);
    return orbitStore.update(t => t.addRecord(normalizedProperties)).then(() => {
      const { type, id } = normalizedProperties;
      return this._identityMap.lookup({ type, id });
    });
  },

  findRecord(type, id) {
    return this
      .get('orbitStore').query(q => q.record({type, id}))
      .then(record => this._identityMap.lookup(record));
  },

  removeRecord(record) {
    return this.get('orbitStore').transform(t => t.removeRecord(record.getIdentifier()));
  },

  _verifyType(type) {
    assert("`type` must be registered as a model in the container", get(this, 'schema').modelFor(type));
  },

  _didPatch: function(operation) {
    console.debug('didPatch', operation);
    const { path } = operation;
    const { type, id } = operation.record;
    const record = this._identityMap.lookup({ type, id });

    switch(operation.op) {
      case 'replaceAttribute': return record.propertyDidChange(operation.attribute);
      case 'replaceHasOne': return record.propertyDidChange(operation.relationship);
      case 'removeRecord': return record.disconnect();
    }
  }
});
