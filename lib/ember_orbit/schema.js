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
   @method init
   @private
   */
  init: function() {
    this._schema = new OrbitSchema({
      idField: get(this, 'idField')
    });
  },

  defineModel: function(type, modelClass) {
    this._schema.models[type] = {
      attributes: get(modelClass, 'attributes'),
      links: get(modelClass, 'links')
    };
  },

  initRecord: function(type, record) {
    return this._schema.initRecord(type, record);
  },

  models: function() {
    return Object.keys(this._schema.models);
  },

  attributes: function(type) {
    return Object.keys(this._schema.models[type].attributes);
  },

  attributeProperties: function(type, name) {
    return this._schema.models[type].attributes[name];
  },

  links: function(type) {
    return Object.keys(this._schema.models[type].links);
  },

  linkProperties: function(type, name) {
    return this._schema.models[type].links[name];
  }
});

export default Schema;