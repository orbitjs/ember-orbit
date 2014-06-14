import HasOneObject from './links/has_one_object';
import HasManyArray from './links/has_many_array';

var get = Ember.get;

/**
 @class Model
 @namespace EO
*/
var Model = Ember.Object.extend(Ember.Evented, {
  getAttribute: function(key) {
    var store = get(this, 'store');
    var type = this.constructor.typeKey;
    var id = get(this, get(store, 'idField'));

    return store.retrieveAttribute(type, id, key);
  },

  getLink: function(key) {
    var store = get(this, 'store');
    var type = this.constructor.typeKey;
    var id = get(this, get(store, 'idField'));

    var relatedRecord = store.retrieveLink(type, id, key) || null;

    var hasOneObject = HasOneObject.create({
      content: relatedRecord,
      store: store,
      _ownerId: id,
      _ownerType: type,
      _linkKey: key
    });

    this._assignLink(key, hasOneObject);

    return hasOneObject;
  },

  getLinks: function(key) {
    var store = get(this, 'store');
    var type = this.constructor.typeKey;
    var id = get(this, get(store, 'idField'));

    var relatedRecords = store.retrieveLinks(type, id, key) || Ember.A();

    var hasManyArray = HasManyArray.create({
      content: relatedRecords,
      store: this.store,
      _ownerId: id,
      _ownerType: type,
      _linkKey: key
    });

    this._assignLink(key, hasManyArray);

    return hasManyArray;
  },

  patch: function(key, value) {
    var store = get(this, 'store');
    var type = this.constructor.typeKey;
    var id = get(this, get(store, 'idField'));

    return store.patch(type, id, key, value);
  },

  addLink: function(key, relatedRecord) {
    var store = get(this, 'store');
    var type = this.constructor.typeKey;
    var id = get(this, get(store, 'idField'));
    var relatedId = get(relatedRecord, get(store, 'idField'));

    return store.addLink(type, id, key, relatedId);
  },

  removeLink: function(key, relatedRecord) {
    var store = get(this, 'store');
    var type = this.constructor.typeKey;
    var id = get(this, get(store, 'idField'));
    var relatedId = get(relatedRecord, get(store, 'idField'));

    return store.removeLink(type, id, key, relatedId);
  },

  remove: function() {
    var store = get(this, 'store');
    var type = this.constructor.typeKey;
    var id = get(this, get(store, 'idField'));

    return store.remove(type, id);
  },

  willDestroy: function() {
    this._super();

    var store = get(this, 'store');
    var type = this.constructor.typeKey;
    var id = get(this, get(store, 'idField'));

    store.unload(type, id);
  },

  _assignLink: function(key, value) {
    this._links = this._links || {};
    this._links[key] = value;
  }
});

Model.reopenClass({
  _create: Model.create,

  create: function() {
    throw new Ember.Error("You should not call `create` on a model. Instead, call `store.add` with the attributes you would like to set.");
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
