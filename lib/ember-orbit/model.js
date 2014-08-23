import HasOneObject from './links/has-one-object';
import HasManyArray from './links/has-many-array';
import key from 'ember-orbit/fields/key';
import { uuid } from 'orbit/lib/uuid';

/**
 @module ember-orbit
 */

var get = Ember.get;
var set = Ember.set;

/**
 @class Model
 @namespace EO
 */
var Model = Ember.Object.extend(Ember.Evented, {
  primaryId: null,

  getKey: function(field) {
    var store = get(this, 'store');
    var pk = this.constructor.primaryKey;

    if (pk === field) {
      return this.primaryId;
    } else {
      return store.retrieveKey(type, this.primaryId, field);
    }
  },

  getAttribute: function(field) {
    var store = get(this, 'store');
    var type = this.constructor.typeKey;
    var id = get(this, 'primaryId');

    return store.retrieveAttribute(type, id, field);
  },

  getLink: function(field) {
    var store = get(this, 'store');
    var type = this.constructor.typeKey;
    var id = get(this, 'primaryId');

    var relatedRecord = store.retrieveLink(type, id, field) || null;

    var hasOneObject = HasOneObject.create({
      content: relatedRecord,
      store: store,
      _ownerId: id,
      _ownerType: type,
      _linkField: field
    });

    this._assignLink(field, hasOneObject);

    return hasOneObject;
  },

  getLinks: function(field) {
    var store = get(this, 'store');
    var type = this.constructor.typeKey;
    var id = get(this, 'primaryId');

    var relatedRecords = store.retrieveLinks(type, id, field) || Ember.A();

    var hasManyArray = HasManyArray.create({
      content: relatedRecords,
      store: this.store,
      _ownerId: id,
      _ownerType: type,
      _linkField: field
    });

    this._assignLink(field, hasManyArray);

    return hasManyArray;
  },

  patch: function(field, value) {
    var store = get(this, 'store');
    var type = this.constructor.typeKey;

    return store.patch(type, this.primaryId, field, value);
  },

  addLink: function(field, relatedRecord) {
    var store = get(this, 'store');
    var type = this.constructor.typeKey;

    return store.addLink(type, this.primaryId, field, relatedRecord.primaryId);
  },

  removeLink: function(field, relatedRecord) {
    var store = get(this, 'store');
    var type = this.constructor.typeKey;

    return store.removeLink(type, this.primaryId, field, relatedRecord.primaryId);
  },

  remove: function() {
    var store = get(this, 'store');
    var type = this.constructor.typeKey;

    return store.remove(type, this.primaryId);
  },

  willDestroy: function() {
    this._super();

    var store = get(this, 'store');
    var type = this.constructor.typeKey;

    store.unload(type, this.primaryId);
  },

  _assignLink: function(field, value) {
    this._links = this._links || {};
    this._links[field] = value;
  }
});

var _create = Model.create;

Model.reopenClass({
  _create: function(store, id) {
    var record = _create.call(this, {store: store});
    set(record, 'primaryId', id);
    return record;
  },

  create: function() {
    throw new Ember.Error("You should not call `create` on a model. Instead, call `store.add` with the attributes you would like to set.");
  },

  keys: Ember.computed(function() {
    var map = {};
    var _this = this;
    var primaryKey;

    function evaluateKeys() {
      _this.eachComputedProperty(function(name, meta) {
        if (meta.isKey) {
          meta.name = name;
          map[name] = meta.options;
          if (meta.options.primaryKey) {
            _this.primaryKey = name;
          }
        }
      });
    }
    evaluateKeys();

    // Set a single primary key named `id` if no other has been defined
    if (!primaryKey) {
      this.reopen({
        id: key('string', {primaryKey: true, defaultValue: uuid})
      });
      evaluateKeys();
    }

    return map;
  }),

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
