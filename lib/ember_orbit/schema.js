import OrbitSchema from 'orbit_common/schema';

var Schema = Ember.Object.extend({
  /**
   @method init
   @private
   */
  init: function() {
    this._schema = new OrbitSchema();
  },

  defineModel: function(type, modelClass) {
    this._schema.models[type] = {
      attributes: modelClass.attributes,
      links: modelClass.links
    };
  }
});

export default Schema;