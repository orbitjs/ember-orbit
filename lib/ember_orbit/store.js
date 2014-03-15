import Schema from './schema';
import MemorySource from 'orbit_common/memory_source';

var Store = Ember.Object.extend({
  schema: null,

  /**
   @method init
   @private
   */
  init: function() {
    if (!this.schema) {
      this.schema = Schema.create();
    }

    this._source = new MemorySource(this.schema._schema);
  },

  modelFor: function(key) {
    var model;

    if (typeof key === 'string') {
      var normalizedKey = this.container.normalize('model:' + key);

      model = this.container.lookupFactory(normalizedKey);
      if (!model) { throw new Ember.Error("No model was found for '" + key + "'"); }
      model.typeKey = normalizedKey.split(':', 2)[1];
    } else {
      // A model already supplied.
      model = key;
    }

    model.store = this;
    return model;
  },

//  createRecord: function(type, properties) {
//    type = this.modelFor(type);
//    var record = this.buildRecord(type, properties);
//    return record;
//  },
//
//  buildRecord: function(type, properties) {
//    var typeMap = this.typeMapFor(type),
//        idToRecord = typeMap.idToRecord;
//
//    // lookupFactory should really return an object that creates
//    // instances with the injections applied
//    var record = type._create({
//      id: id,
//      store: this,
//      container: this.container
//    });
//
//    if (data) {
//      record.setupData(data);
//    }
//
//    // if we're creating an item, this process will be done
//    // later, once the object has been persisted.
//    if (id) {
//      idToRecord[id] = record;
//    }
//
//    typeMap.records.push(record);
//
//    return record;
//  }
});

export default Store;
