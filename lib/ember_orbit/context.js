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

    if (typeMap) { return typeMap; }

    typeMap = {
      records: {},
      type: type
    };

    this.typeMaps[type] = typeMap;

    return typeMap;
  },

  createRecord: function(type, properties) {
    var model = get(this, 'store').modelFor(type),
        self = this;

    // TODO: normalize properties
    return this._source.add(model.typeKey, properties).then(function(data) {
      return self._buildRecord(model, data);
    });
  },

  recordForId: function(type, id) {
    var typeMap = this.typeMapFor(type);

    return typeMap.records[id];
  },

  _buildRecord: function(model, properties) {
    var type = model.typeKey,
        typeMap = this.typeMapFor(type),
        id = properties[this.get('idField')];

    var record = model._create({
      context: this,
      __id__: id
    });

    typeMap.records[id] = record;

    return record;
  }
});

export default Context;