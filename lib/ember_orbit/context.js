import Store from './store';
import Source from './source';
import Model from './model';
import RecordArrayManager from './record_array_manager';
import OCMemorySource from 'orbit_common/memory_source';

var get = Ember.get,
    set = Ember.set;

var Promise = Ember.RSVP.Promise;
var PromiseArray = Ember.ArrayProxy.extend(Ember.PromiseProxyMixin);
var PromiseObject = Ember.ObjectProxy.extend(Ember.PromiseProxyMixin);

function promiseArray(promise, label) {
  return PromiseArray.create({
    promise: Promise.cast(promise, label)
  });
}

function promiseObject(promise, label) {
  return PromiseObject.create({
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

    this.then = this._source.transformQueue.then;
    this._source.on('didTransform', this.didTransform, this);

    this._recordArrayManager = RecordArrayManager.create({
      context: this
    });
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
    var _this = this,
        op = operation.op,
        path = operation.path,
        value = operation.value,
        record;

    if (op === 'add') {
      record = _this._lookupRecord(path[0], path[1]);

    } else if (op === 'replace') {
      record = _this._lookupRecord(path[0], path[1]);
      record.propertyDidChange(path[2]);

    } else if (op === 'remove') {
      record = _this._lookupRecord(path[0], path[1]);
      set(record, 'isDeleted', true);
    }

    if (record) {
      this._recordArrayManager.recordDidChange(record);
    }
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
    var promise;
    var length = arguments.length;
    var array;
    var hasQuery = length === 3;

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

  add: function(type, properties) {
    var _this = this;

    // TODO: normalize properties
    return this._source.add(type, properties).then(function(data) {
      var id = data[_this.get('idField')];
      return _this._lookupRecord(type, id);
    });
  },

  remove: function(type, id) {
    var _this = this;

    if (arguments.length === 1) {
      if (type instanceof Model) {
        var record = type;
        id = record[get(this, 'idField')];
        type = record.constructor.typeKey;
      }
    }

    return this._source.remove(type, id);
  },

  find: function(type, id) {
    var _this = this;

    return this._source.find(type, id).then(function(data) {

      if (id === undefined || Ember.typeOf(id) === 'object') {
        return _this._lookupRecordsFromData(type, data);

      } else if (Ember.isArray(id)) {
        return _this._lookupRecords(type, id);

      } else {
        return _this._lookupRecord(type, id);
      }
    });
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

    } else if (this._source.retrieve([type, id])) {
      return this._lookupRecord(type, id);
    }
  },

  getAttribute: function(record, key) {
    var id = record[get(this, 'idField')],
        path = [record.constructor.typeKey, id, key];

    return this._source.retrieve(path);
  },

  setAttribute: function(record, key, value) {
    var id = record[get(this, 'idField')];
    return this._source.patch(record.constructor.typeKey, id, key, value);
  },

  getLink: function(record, key) {
    var id = record[get(this, 'idField')],
        path = [record.constructor.typeKey, id, 'links', key];

    var relatedId = this._source.retrieve(path);
    if (relatedId) {
      var type;

      if (Ember.isObject(relatedId)) {
        type = relatedId.type;
        relatedId = relatedId[get(this, 'idField')];

      } else {
        var schema = get(this, 'schema');
        type = schema.getLinkProperties(record.constructor.typeKey, key).type;
      }

      return promiseObject(this.find(type, relatedId),
                           "OE: Context#find type " + type + " with id " + relatedId);

    } else {
      return null;
    }
  },

  setLink: function(record, key, value) {
    var id = record[get(this, 'idField')],
        relatedId = value[get(this, 'idField')];

    return this._source.link(record.constructor.typeKey, id, key, relatedId);
  },

  unload: function(type, id) {
    var typeMap,
        record;

    if (arguments.length === 1 && type instanceof Model) {
      record = type;
      typeMap = this.typeMapFor(record.constructor.typeKey);
    } else {
      typeMap = this.typeMapFor(type);
      record = typeMap.records[id];
    }

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

  _lookupRecordsFromData: function(type, data) {
    var idField = this.get('idField');
    var ids = data.map(function(recordData) {
      return recordData[idField];
    });
    return this._lookupRecords(type, ids);
  },
});

export default Context;