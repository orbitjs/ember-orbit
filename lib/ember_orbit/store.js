import Source from './source';
import Model from './model';
import RecordArrayManager from './record_array_manager';
import OCMemorySource from 'orbit_common/memory_source';

var get = Ember.get,
    set = Ember.set;

var Promise = Ember.RSVP.Promise;

var PromiseArray = Ember.ArrayProxy.extend(Ember.PromiseProxyMixin);
function promiseArray(promise, label) {
  return PromiseArray.create({
    promise: Promise.cast(promise, label)
  });
}

var Store = Source.extend({
  orbitSourceClass: OCMemorySource,
  schema: null,
  idField: Ember.computed.alias('schema.idField'),

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
    return Ember.RSVP.all(this._requests.toArray()).then(success, failure);
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

    promise = promise || Promise.cast(array);

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

    // TODO: normalize properties
    var promise = this.orbitSource.add(type, properties).then(function(data) {
      return _this._lookupFromData(type, data);
    });

    return this._request(promise);
  },

  remove: function(type, id) {
    this._verifyType(type);

    var promise = this.orbitSource.remove(type, id);

    return this._request(promise);
  },

  patch: function(type, id, key, value) {
    this._verifyType(type);

    var promise = this.orbitSource.patch(type, id, key, value);

    return this._request(promise);
  },

  addLink: function(type, id, key, relatedId) {
    this._verifyType(type);

    var promise = this.orbitSource.addLink(type, id, key, relatedId);

    return this._request(promise);
  },

  removeLink: function(type, id, key, relatedId) {
    this._verifyType(type);

    var promise = this.orbitSource.removeLink(type, id, key, relatedId);

    return this._request(promise);
  },

  findLink: function(type, id, key) {
    var _this = this;
    this._verifyType(type);

    var linkType = get(this, 'schema').linkProperties(type, key).model;

    var promise = this.orbitSource.findLink(type, id, key).then(function(data) {
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
      if (typeof id === 'object') {
        var idField = get(this, 'idField');
        id = get(id, idField);
      }
      if (this.orbitSource.retrieve([type, id])) {
        return this._lookupRecord(type, id);
      }
    }
  },

  retrieveAttribute: function(type, id, key) {
    this._verifyType(type);

    return this.orbitSource.retrieve([type, id, key]);
  },

  retrieveLink: function(type, id, key) {
    this._verifyType(type);

    var linkType = get(this, 'schema').linkProperties(type, key).model;

    var relatedId = this.orbitSource.retrieve([type, id, '__rel', key]);

    if (linkType && relatedId) {
      return this.retrieve(linkType, relatedId);
    }
  },

  retrieveLinks: function(type, id, key) {
    this._verifyType(type);

    var linkType = get(this, 'schema').linkProperties(type, key).model;

    var relatedIds = Object.keys(this.orbitSource.retrieve([type, id, '__rel', key]));

    if (linkType && Ember.isArray(relatedIds) && relatedIds.length > 0) {
      return this.retrieve(linkType, relatedIds);
    }
  },

  unload: function(type, id) {
    this._verifyType(type);

    var typeMap = this.typeMapFor(type);
    delete typeMap.records[id];
  },

  _verifyType: function(type) {
    Ember.assert("`type` must be registered as a model in the container", get(this, 'schema').modelFor(type));
  },

  _didTransform: function(operation, inverse) {
    console.log('_didTransform', operation, inverse);

    var op = operation.op,
        path = operation.path,
        value = operation.value,
        record = this._lookupRecord(path[0], path[1]);

    if (path.length === 3) {
      // attribute changed
      record.propertyDidChange(path[2]);

    } else if (path.length === 4) {
      // hasOne link changed
      var key = path[3];
      var link = this.retrieveLink(path[0], path[1], key);
      record.set(key, link);
    }

    // trigger record array changes
    this._recordArrayManager.recordDidChange(record, operation);
  },

  _lookupRecord: function(type, id) {
    var typeMap = this.typeMapFor(type),
        record = typeMap.records[id];

    if (record === undefined) {
      var model = get(this, 'schema').modelFor(type);

      var data = {
        store: this
      };
      data[get(this, 'idField')] = id;

      record = model._create(data);

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
    var idField = get(this, 'idField');
    if (Ember.isArray(data)) {
      var ids = data.map(function(recordData) {
        return recordData[idField];
      });
      return this._lookupRecords(type, ids);
    } else {
      return this._lookupRecord(type, data[idField]);
    }
  },

  _request: function(promise) {
    var requests = this._requests;
    requests.add(promise);
    return promise.finally(function() {
      requests.remove(promise);
    });
  }
});

export default Store;