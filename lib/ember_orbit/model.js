var get = Ember.get;

/**
 @class Model
 @namespace EO
*/
var Model = Ember.Object.extend(Ember.Evented);

Model.reopenClass({
  _create: Model.create,

  create: function() {
    throw new Ember.Error("You should not call `create` on a model. Instead, call `store.createRecord` with the attributes you would like to set.");
  },

  attributes: Ember.computed(function() {
    var map = {};

    this.eachComputedProperty(function(name, meta) {
      if (meta.isAttribute) {
        meta.name = name;
        map[name] = meta;
      }
    });

    return map;
  }),

  links: Ember.computed(function() {
    var map = {};

    this.eachComputedProperty(function(name, meta) {
      if (meta.isLink) {
        meta.name = name;
        map[name] = meta;
      }
    });

    return map;
  })
});

export default Model;
