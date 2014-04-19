import OrbitSchema from 'orbit_common/schema';

var get = Ember.get;

var Schema = Ember.Object.extend({
  /**
   @method init
   @private
   */
  init: function() {
    this._schema = new OrbitSchema();
  },

  idField: function() {
    return this._schema.idField;
  }.property(),

  defineModel: function(type, modelClass) {
    this._schema.models[type] = {
      attributes: get(modelClass, 'attributes'),
      links: get(modelClass, 'links')
    };
  }
});

export default Schema;