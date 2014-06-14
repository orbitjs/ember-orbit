import OrbitSchema from 'orbit_common/schema';

var get = Ember.get;

var Schema = Ember.Object.extend({
  /**
   @property idField
   @type {String}
   @default 'clientid'
   */
  idField: 'clientid',

  /**
   @property remoteIdField
   @type {String}
   @default 'id'
   */
  remoteIdField: 'id',

  init: function() {
    this._super.apply(this, arguments);
    this._modelTypeMap = {};
  },

  _schema: function() {
    // Delay creation of the underlying Orbit.Schema until
    // its been requested. This allows for setting of `idField`
    // and `remoteIdField`.
    var schema = new OrbitSchema({
      idField: get(this, 'idField'),
      remoteIdField: get(this, 'remoteIdField')
    });

    return schema;

  }.property(),

  defineModel: function(type, modelClass) {
    var _schema = get(this, '_schema');
    var definedModels = _schema.models;
    if (!definedModels[type]) {
      _schema.registerModel(type, {
        attributes: get(modelClass, 'attributes'),
        links: get(modelClass, 'links')
      });
    }
  },

  modelFor: function(type) {
    Ember.assert("`type` must be a string", typeof type === 'string');

    var model = this._modelTypeMap[type];
    if (!model) {
      model = this.container.lookupFactory('model:' + type);
      if (!model) {
        throw new Ember.Error("No model was found for '" + type + "'");
      }
      model.typeKey = type;

      // ensure model is defined in underlying OC.Schema
      this.defineModel(type, model);

      // save model in map for faster lookups
      this._modelTypeMap[type] = model;
    }

    return model;
  },

  initRecord: function(type, record) {
    return get(this, '_schema').initRecord(type, record);
  },

  models: function() {
    return Object.keys(get(this, '_schema').models);
  },

  attributes: function(type) {
    return Object.keys(get(this, '_schema').models[type].attributes);
  },

  attributeProperties: function(type, name) {
    return get(this, '_schema').models[type].attributes[name];
  },

  links: function(type) {
    return Object.keys(get(this, '_schema').models[type].links);
  },

  linkProperties: function(type, name) {
    return get(this, '_schema').models[type].links[name];
  }
});

export default Schema;