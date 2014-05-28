import Store from './store';
import Source from './source';
import Model from './model';
import RecordArrayManager from './record_array_manager';
import OCMemorySource from 'orbit_common/memory_source';

var get = Ember.get,
    set = Ember.set;

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

    if (op === 'replace') {
      record = _this._lookupRecord(path[0], path[1]);
      record.propertyDidChange(path[2]);
      this._recordArrayManager.recordDidChange(record);

    } else if (op === 'remove') {
      record = _this._lookupRecord(path[0], path[1]);
      set(record, 'isDeleted', true);
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