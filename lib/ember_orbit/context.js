import Store from './store';
import Source from './source';
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

  add: function(type, properties) {
    var self = this;

    // TODO: normalize properties
    return this._source.add(type, properties).then(function(data) {
      var id = data[self.get('idField')];
      return self._lookupRecord(type, id);
    });
  },

  remove: function(type, id) {
    var self = this;

    return this._source.remove(type, id).then(function() {
      self._unloadRecord(type, id);
    });
  },

  find: function(type, id) {
    var self = this;

    return this._source.find(type, id).then(function(data) {

      if (id === undefined || Ember.typeOf(id) === 'object') {
        return self._lookupRecordsFromData(type, data);

      } else if (Ember.isArray(id)) {
        return self._lookupRecords(type, id);

      } else {
        return self._lookupRecord(type, id);
      }
    });
  },

  recordForId: function(type, id) {
    return this.typeMapFor(type).records[id];
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
    var self = this;
    return ids.map(function(id) {
      return self._lookupRecord(type, id);
    });
  },

  _lookupRecordsFromData: function(type, data) {
    var idField = this.get('idField');
    var ids = data.map(function(recordData) {
      return recordData[idField];
    });
    return this._lookupRecords(type, ids);
  },

  _unloadRecord: function(type, id) {
    var typeMap = this.typeMapFor(type),
        record = typeMap.records[id];

    if (record) {
      delete typeMap.records[id];
      record.destroy();
    }
  }
});

export default Context;