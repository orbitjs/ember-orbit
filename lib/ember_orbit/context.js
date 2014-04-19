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

    this._super.apply(this, arguments);
  },

  createRecord: function(type, properties) {
    var model = get(this, 'store').modelFor(type),
        self = this;

    // TODO: normalize properties
    return this._source.add(model.typeKey, properties).then(function(data) {
      return self._buildRecord(model, data);
    });
  },

  _buildRecord: function(model, properties) {
    return model._create({
      context: this,
      __id__: properties[this.get('idField')]
    });
  }
});

export default Context;