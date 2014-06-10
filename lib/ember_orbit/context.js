import Store from './store';
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

var Context = Source.extend({
  store: null,
  SourceClass: OCMemorySource,

  schema: null,
  idField: Ember.computed.alias('schema.idField'),

  init: function() {
    var store = get(this, 'store');
    Ember.assert("`Context.store` must be initialized with an instance of a `Store`", store);

    var schema = get(store, 'schema');
    set(this, 'schema', schema);

    this.typeMaps = {};

    this._super.apply(this, arguments);

    this._source.on('didTransform', this.didTransform, this);

    this._requests = Ember.OrderedSet.create();

    this._recordArrayManager = RecordArrayManager.create({
      context: this
    });
  },

  then: function(success, failure) {
    return Ember.RSVP.all(this._requests.toArray()).then(success, failure);
  },

  willDestroy: function() {
    this._source.off('didTransform', this.didTransform, this);
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
    return this._source.transform(operation);
  },

  didTransform: function(operation, inverse) {
    console.log('didTransform', operation, inverse);

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

  all: function(type) {
    var typeMap = this.typeMapFor(type),
        findAllCache = typeMap.findAllCache;

    if (findAllCache) { return findAllCache; }

    var array = this._recordArrayManager.createRecordArray(type);

    typeMap.findAllCache = array;
    return array;
  },

  filter: function(type, query, filter) {
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
    }, null, "OE: Context#filter of " + type));
  },

  find: function(type, id) {
    var _this = this;

    var promise = this._source.find(type, id).then(function(data) {
      if (Ember.isArray(data)) {
        return _this._lookupRecordsFromData(type, data);
      } else {
        return _this._lookupRecordFromData(type, data);
      }
    });

    return this._request(promise);
  },

  add: function(type, properties) {
    var _this = this;

    // TODO: normalize properties
    var promise = this._source.add(type, properties).then(function(data) {
      return _this._lookupRecordFromData(type, data);
    });

    return this._request(promise);
  },

  remove: function(type, id) {
    var promise = this._source.remove(type, id);

    return this._request(promise);
  },

  patch: function(type, id, key, value) {
    var promise = this._source.patch(type, id, key, value);

    return this._request(promise);
  },

  link: function(type, id, key, relatedId) {
    var promise = this._source.link(type, id, key, relatedId);

    return this._request(promise);
  },

  unlink: function(type, id, key, relatedId) {
    var promise = this._source.unlink(type, id, key, relatedId);

    return this._request(promise);
  },

  findLink: function(type, id, key) {
    var _this = this,
        path = [type, id, 'links', key],
        linkType,
        relatedId,
        promise;

    linkType = get(this, 'schema').linkProperties(type, key).model;

    relatedId = this._source.retrieve(path);

    if (linkType) {
      promise = this._source.find(linkType, relatedId);
    } else {
      promise = this._source.find(relatedId);
    }

    return this._request(promise.then(function(data) {
      return _this._source.transform({
        op: 'replace',
        path: path,
        value: data

      }).then(function() {
        return _this.retrieveLink(type, id, key);
      });
    }));
  },

  retrieve: function(type, id) {
    var ids;
    if (arguments.length === 1) {
      ids = Object.keys(this._source.retrieve([type]));

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
      if (this._source.retrieve([type, id])) {
        return this._lookupRecord(type, id);
      }
    }
  },

  retrieveAttribute: function(type, id, key) {
    return this._source.retrieve([type, id, key]);
  },

  retrieveLink: function(type, id, key) {
    var linkType = get(this, 'schema').linkProperties(type, key).model;

    var relatedId = this._source.retrieve([type, id, 'links', key]);

    if (linkType && relatedId) {
      return this.retrieve(linkType, relatedId);
    }
  },

  retrieveLinks: function(type, id, key) {
    var linkType = get(this, 'schema').linkProperties(type, key).model;

    var relatedIds = Object.keys(this._source.retrieve([type, id, 'links', key]));

    if (linkType && Ember.isArray(relatedIds) && relatedIds.length > 0) {
      return this.retrieve(linkType, relatedIds);
    }
  },

  unload: function(type, id) {
    var typeMap = this.typeMapFor(type);
    var record = typeMap.records[id];

    if (record) {
      delete typeMap.records[id];
      record.destroy();
    }
  },

  _lookupRecord: function(type, id) {
    var typeMap = this.typeMapFor(type),
        record = typeMap.records[id];

    if (record === undefined) {
      var model = get(this, 'store').modelFor(type);

      var data = {
        context: this
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

  _lookupRecordFromData: function(type, data) {
    var idField = get(this, 'idField');
    return this._lookupRecord(type, data[idField]);
  },

  _lookupRecordsFromData: function(type, data) {
    var idField = get(this, 'idField');
    var ids = data.map(function(recordData) {
      return recordData[idField];
    });
    return this._lookupRecords(type, ids);
  },

  _request: function(promise) {
    var requests = this._requests;
    requests.add(promise);
    return promise.finally(function() {
      requests.remove(promise);
    });
  }
});

export default Context;