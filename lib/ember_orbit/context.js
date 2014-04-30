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

  createRecord: function(type, properties) {
    var self = this;

    // TODO: normalize properties
    return this._source.add(type, properties).then(function(data) {
      var id = data[self.get('idField')];
      return self._lookupRecord(type, id);
    });
  },

  find: function(type, id) {
    if (arguments.length === 1) {
      return this._findAll(type);

    } else if (Ember.typeOf(id) === 'object') {
      return this._findQuery(type, id);

    } else if (Ember.isArray(id)) {
      return this._findByIds(type, id);

    } else {
      return this._findById(type, id);
    }
  },

  recordForId: function(type, id) {
    var typeMap = this.typeMapFor(type);

    return typeMap.records[id];
  },

  _findAll: function(type) {
    var self = this;
    return this._source.find(type).then(function(data) {
      return self._lookupRecordsFromData(type, data);
    });
  },

  _findQuery: function(type, query) {
    var self = this;
    return this._source.find(type, query).then(function(data) {
      return self._lookupRecordsFromData(type, data);
    });
  },

  _findById: function(type, id) {
    var self = this;

    return this._source.find(type, id).then(function() {
      return self._lookupRecord(type, id);
    });
  },

  _findByIds: function(type, ids) {
    var self = this;

    return this._source.find(type, ids).then(function() {
      return self._lookupRecords(type, ids);
    });
  },

  _lookupRecord: function(type, id) {
    var typeMap = this.typeMapFor(type),
        record = typeMap.records[id];

    if (record === undefined) {
      var model = get(this, 'store').modelFor(type);

      record = model._create({
        context: this,
        __id__: id
      });

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
  }
});

export default Context;