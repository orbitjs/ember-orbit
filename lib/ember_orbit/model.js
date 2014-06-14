import HasOneObject from './links/has_one_object';
import HasManyArray from './links/has_many_array';

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

    var relatedRecord = context.retrieveLink(type, id, key) || null;

    var hasOneObject = HasOneObject.create({
      content: relatedRecord,
      context: context,
      _ownerId: id,
      _ownerType: type,
      _linkKey: key
    });

    this._assignLink(key, hasOneObject);

    return hasOneObject;
  },

  getLinks: function(key) {
    var context = get(this, 'context');
    var type = this.constructor.typeKey;
    var id = get(this, get(context, 'idField'));

    var relatedRecords = context.retrieveLinks(type, id, key) || Ember.A();

    var hasManyArray = HasManyArray.create({
      content: relatedRecords,
      context: this.context,
      _ownerId: id,
      _ownerType: type,
      _linkKey: key
    });

    this._assignLink(key, hasManyArray);

    return hasManyArray;
  },

  patch: function(key, value) {
    var context = get(this, 'context');
    var type = this.constructor.typeKey;
    var id = get(this, get(context, 'idField'));

    return context.patch(type, id, key, value);
  },

  addLink: function(key, relatedRecord) {
    var context = get(this, 'context');
    var type = this.constructor.typeKey;
    var id = get(this, get(context, 'idField'));
    var relatedId = get(relatedRecord, get(context, 'idField'));

    return context.addLink(type, id, key, relatedId);
  },

  removeLink: function(key, relatedRecord) {
    var context = get(this, 'context');
    var type = this.constructor.typeKey;
    var id = get(this, get(context, 'idField'));
    var relatedId = get(relatedRecord, get(context, 'idField'));

    return context.removeLink(type, id, key, relatedId);
  },

  remove: function() {
    var context = get(this, 'context');
    var type = this.constructor.typeKey;
    var id = get(this, get(context, 'idField'));

    return context.remove(type, id);
  },

  willDestroy: function() {
    this._super();

    var context = get(this, 'context');
    var type = this.constructor.typeKey;
    var id = get(this, get(context, 'idField'));

    context.unload(type, id);
  },

  _assignLink: function(key, value) {
    this._links = this._links || {};
    this._links[key] = value;
  }
});

Model.reopenClass({
  _create: Model.create,

  create: function() {
    throw new Ember.Error("You should not call `create` on a model. Instead, call `context.add` with the attributes you would like to set.");
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
