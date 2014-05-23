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
  }
});

export default Schema;