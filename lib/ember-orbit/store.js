import Source from './source';
import Model from './model';
import RecordArrayManager from './record-array-manager';
import OCMemorySource from 'orbit-common/memory-source';

/**
 @module ember-orbit
 */

var get = Ember.get,
    set = Ember.set;

var RSVP = Ember.RSVP;

var PromiseArray = Ember.ArrayProxy.extend(Ember.PromiseProxyMixin);
function promiseArray(promise, label) {
  return PromiseArray.create({
    promise: RSVP.Promise.cast(promise, label)
  });
}

var Store = Source.extend({
  orbitSourceClass: OCMemorySource,
  schema: null,

  init: function() {
    this._super.apply(this, arguments);

    this.typeMaps = {};

    this.orbitSource.on('didTransform', this._didTransform, this);

    this._requests = Ember.OrderedSet.create();

    this._recordArrayManager = RecordArrayManager.create({
      store: this
    });
  },

  then: function(success, failure) {
    return this.settleRequests().then(success, failure);
  },

  settleRequests: function() {
    return Ember.RSVP.all(this._requests.toArray());
  },

  settleTransforms: function() {
    return this.orbitSource.settleTransforms();
  },

  willDestroy: function() {
    this.orbitSource.off('didTransform', this.didTransform, this);
    this._recordArrayManager.destroy();
    this._super.apply(this, arguments);
  },

  typeMapFor: function(type) {
    var typeMap = this.typeMaps[type];

    if (typeMap) return typeMap;

    typeMap = {
      records: {},
      type: type
    };

    this.typeMaps[type] = typeMap;

    return typeMap;
  },

  transform: function(operation) {
    return this.orbitSource.transform(operation);
  },

  all: function(type) {
    this._verifyType(type);

    var typeMap = this.typeMapFor(type),
        findAllCache = typeMap.findAllCache;

    if (findAllCache) { return findAllCache; }

    var array = this._recordArrayManager.createRecordArray(type);

    typeMap.findAllCache = array;
    return array;
  },

  filter: function(type, query, filter) {
    this._verifyType(type);

    var length = arguments.length;
    var hasQuery = length === 3;
    var promise;
    var array;

    if (hasQuery) {
      promise = this.find(type, query);
    } else if (length === 2) {
      filter = query;
    }

    if (hasQuery) {
      array = this._recordArrayManager.createFilteredRecordArray(type, filter, query);
    } else {
      array = this._recordArrayManager.createFilteredRecordArray(type, filter);
    }

    promise = promise || RSVP.Promise.cast(array);

    return promiseArray(promise.then(function() {
      return array;
    }, null, "OE: Store#filter of " + type));
  },

  find: function(type, id) {
    var _this = this;
    this._verifyType(type);

    var promise = this.orbitSource.find(type, id).then(function(data) {
      return _this._lookupFromData(type, data);
    });

    return this._request(promise);
  },

  add: function(type, properties) {
    var _this = this;
    this._verifyType(type);
    properties = properties || {};

    get(this, 'schema').normalize(type, properties);
    var promise = this.orbitSource.add(type, properties).then(function(data) {
      return _this._lookupFromData(type, data);
    });

    return this._request(promise);
  },

  remove: function(type, id) {
    this._verifyType(type);
    id = this._normalizeId(id);

    var promise = this.orbitSource.remove(type, id);

    return this._request(promise);
  },

  patch: function(type, id, field, value) {
    this._verifyType(type);
    id = this._normalizeId(id);

    var promise = this.orbitSource.patch(type, id, field, value);

    return this._request(promise);
  },

  addLink: function(type, id, field, relatedId) {
    this._verifyType(type);
    id = this._normalizeId(id);
    relatedId = this._normalizeId(relatedId);

    var promise = this.orbitSource.addLink(type, id, field, relatedId);

    return this._request(promise);
  },

  removeLink: function(type, id, field, relatedId) {
    this._verifyType(type);
    id = this._normalizeId(id);
    relatedId = this._normalizeId(relatedId);

    var promise = this.orbitSource.removeLink(type, id, field, relatedId);

    return this._request(promise);
  },

  findLink: function(type, id, field) {
    var _this = this;
    this._verifyType(type);
    id = this._normalizeId(id);

    var linkType = get(this, 'schema').linkProperties(type, field).model;
    this._verifyType(linkType);

    var promise = this.orbitSource.findLink(type, id, field).then(function(data) {
      return _this._lookupFromData(linkType, data);
    });

    return this._request(promise);
  },

  findLinked: function(type, id, field) {
    var _this = this;
    this._verifyType(type);
    id = this._normalizeId(id);

    var linkType = get(this, 'schema').linkProperties(type, field).model;
    this._verifyType(linkType);

    var promise = this.orbitSource.findLinked(type, id, field).then(function(data) {
      return _this._lookupFromData(linkType, data);
    });

    return this._request(promise);
  },

  retrieve: function(type, id) {
    this._verifyType(type);

    var ids;
    if (arguments.length === 1) {
      ids = Object.keys(this.orbitSource.retrieve([type]));

    } else if (Ember.isArray(id)) {
      ids = id;
    }

    if (ids) {
      return this._lookupRecords(type, ids);

    } else {
      id = this._normalizeId(id);

      if (this.orbitSource.retrieve([type, id])) {
        return this._lookupRecord(type, id);
      }
    }
  },

  retrieveKey: function(type, id, field) {
    this._verifyType(type);
    id = this._normalizeId(id);

    return this.orbitSource.retrieve([type, id, field]);
  },

  retrieveAttribute: function(type, id, field) {
    this._verifyType(type);
    id = this._normalizeId(id);

    return this.orbitSource.retrieve([type, id, field]);
  },

  retrieveLink: function(type, id, field) {
    this._verifyType(type);
    id = this._normalizeId(id);

    var linkType = get(this, 'schema').linkProperties(type, field).model;
    this._verifyType(linkType);

    var relatedId = this.orbitSource.retrieve([type, id, '__rel', field]);

    if (linkType && relatedId) {
      return this.retrieve(linkType, relatedId);
    }
  },

  retrieveLinks: function(type, id, field) {
    this._verifyType(type);
    id = this._normalizeId(id);

    var linkType = get(this, 'schema').linkProperties(type, field).model;
    this._verifyType(linkType);

    var relatedIds = Object.keys(this.orbitSource.retrieve([type, id, '__rel', field]));

    if (linkType && Ember.isArray(relatedIds) && relatedIds.length > 0) {
      return this.retrieve(linkType, relatedIds);
    }
  },

  unload: function(type, id) {
    this._verifyType(type);
    id = this._normalizeId(id);

    var typeMap = this.typeMapFor(type);
    delete typeMap.records[id];
  },

  _verifyType: function(type) {
    Ember.assert("`type` must be registered as a model in the container", get(this, 'schema').modelFor(type));
  },

  _didTransform: function(operation, inverse) {
//    console.log('_didTransform', operation, inverse);

    var op = operation.op,
        path = operation.path,
        value = operation.value,
        record = this._lookupRecord(path[0], path[1]);

    if (path.length === 3) {
      // attribute changed
      record.propertyDidChange(path[2]);

    } else if (path.length === 4) {
      // hasOne link changed
      var linkName = path[3];
      var linkValue = this.retrieveLink(path[0], path[1], linkName);
      record.set(linkName, linkValue);
    }

    // trigger record array changes
    this._recordArrayManager.recordDidChange(record, operation);
  },

  _lookupRecord: function(type, id) {
    var typeMap = this.typeMapFor(type);
    id = this._normalizeId(id);

    var record = typeMap.records[id];

    if (record === undefined) {
      var model = get(this, 'schema').modelFor(type);

      record = model._create(this, id);

      typeMap.records[id] = record;
    }

    return record;
  },

  _lookupRecords: function(type, ids) {
    var _this = this;
    return ids.map(function(id) {
      return _this._lookupRecord(type, id);
    });
  },

  _lookupFromData: function(type, data) {
    if (Ember.isNone(data)) {
      return null;
    }

    var pk = get(this, 'schema').primaryKey(type);
    if (Ember.isArray(data)) {
      var ids = data.map(function(recordData) {
        return recordData[pk];
      });
      return this._lookupRecords(type, ids);
    } else {
      return this._lookupRecord(type, data[pk]);
    }
  },

  _request: function(promise) {
    var requests = this._requests;
    requests.add(promise);
    return promise.finally(function() {
      requests.delete(promise);
    });
  },

  _normalizeId: function(id) {
    if (id !== null && typeof id === 'object') {
      return id.primaryId;
    } else {
      return id;
    }
  }
});

export default Store;
