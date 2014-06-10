import HasOneObject from './links/has_one_object';

var get = Ember.get;

/**
 @class Model
 @namespace EO
*/
var Model = Ember.Object.extend(Ember.Evented, {
  getAttribute: function(key) {
    var context = get(this, 'context');
    var type = this.constructor.typeKey;
    var id = get(this, get(context, 'idField'));

    return context.retrieveAttribute(type, id, key);
  },

  getLink: function(key) {
    var context = get(this, 'context');
    var type = this.constructor.typeKey;
    var id = get(this, get(context, 'idField'));

    var relatedRecord = context.retrieveLink(type, id, key);

    return HasOneObject.create({
      content: relatedRecord,
      context: context,
      _ownerId: id,
      _ownerType: type,
      _linkKey: key
    });
  },

  getLinks: function(key) {
    var context = get(this, 'context');
    var type = this.constructor.typeKey;
    var id = get(this, get(context, 'idField'));

    var relatedRecords = context.retrieveLinks(type, id, key);

    return context._recordArrayManager.createManyArray(this, key, relatedRecords);
  },

  patch: function(key, value) {
    var context = get(this, 'context');
    var type = this.constructor.typeKey;
    var id = get(this, get(context, 'idField'));

    return context.patch(type, id, key, value);
  },

  link: function(key, relatedRecord) {
    var context = get(this, 'context');
    var type = this.constructor.typeKey;
    var id = get(this, get(context, 'idField'));
    var relatedId = get(relatedRecord, get(context, 'idField'));

    return context.link(type, id, key, relatedId);
  },

  unlink: function(key, relatedRecord) {
    var context = get(this, 'context');
    var type = this.constructor.typeKey;
    var id = get(this, get(context, 'idField'));
    var relatedId = get(relatedRecord, get(context, 'idField'));

    return context.unlink(type, id, key, relatedId);
  },

  remove: function() {
    var context = get(this, 'context');
    var type = this.constructor.typeKey;
    var id = get(this, get(context, 'idField'));

    return context.remove(type, id);
  },

  unload: function() {
    var context = get(this, 'context');
    var type = this.constructor.typeKey;
    var id = get(this, get(context, 'idField'));

    return context.unload(type, id);
  }
});

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
        map[name] = meta.options;
      }
    });

    return map;
  }),

  links: Ember.computed(function() {
    var map = {};

    this.eachComputedProperty(function(name, meta) {
      if (meta.isLink) {
        meta.name = name;
        map[name] = meta.options;
      }
    });

    return map;
  })
});

export default Model;
