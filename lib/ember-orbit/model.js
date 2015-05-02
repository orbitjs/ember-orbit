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
    var pk = get(this.constructor, 'primaryKey');

    if (pk === field) {
      return this.primaryId;
    } else {
      var type = get(this.constructor, 'typeKey');
      return store.retrieveKey(type, this.primaryId, field);
    }
  },

  getAttribute: function(field) {
    var store = get(this, 'store');
    var type = get(this.constructor, 'typeKey');
    var id = get(this, 'primaryId');

    return store.retrieveAttribute(type, id, field);
  },

  getLink: function(field) {
    var store = get(this, 'store');
    var type = get(this.constructor, 'typeKey');
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
    var type = get(this.constructor, 'typeKey');
    var id = get(this, 'primaryId');

    var relatedRecords = Ember.A(store.retrieveLinks(type, id, field) || []);

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
    var type = get(this.constructor, 'typeKey');

    return store.patch(type, this.primaryId, field, value);
  },

  addLink: function(field, relatedRecord) {
    var store = get(this, 'store');
    var type = get(this.constructor, 'typeKey');
    var relatedId = relatedRecord ? relatedRecord.primaryId : null;

    return store.addLink(type, this.primaryId, field, relatedId);
  },

  removeLink: function(field, relatedRecord) {
    var store = get(this, 'store');
    var type = get(this.constructor, 'typeKey');
    var relatedId = relatedRecord ? relatedRecord.primaryId : null;

    return store.removeLink(type, this.primaryId, field, relatedId);
  },

  remove: function() {
    var store = get(this, 'store');
    var type = get(this.constructor, 'typeKey');

    return store.remove(type, this.primaryId);
  },

  willDestroy: function() {
    this.trigger('didUnload');
    this._super();

    var store = get(this, 'store');
    var type = get(this.constructor, 'typeKey');

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

  primaryKey: Ember.computed('keys', function() {
    if (arguments.length > 1) {
      throw new Ember.Error("You should not set `primaryKey` on a model. Instead, define a `key` with the options `{primaryKey: true, defaultValue: idGenerator}`.");
    }

    var keys = get(this, 'keys');
    var keyNames = Object.keys(keys);
    for (var k in keyNames) {
      var keyName = keyNames[k];
      if (keys[keyName].primaryKey) {
        return keyName;
      }
    }
  }),

  keys: Ember.computed(function() {
    var map = {};
    var _this = this;
    var primaryKey;

    _this.eachComputedProperty(function(name, meta) {
      if (meta.isKey) {
        meta.name = name;
        map[name] = meta.options;
        if (meta.options.primaryKey) {
          primaryKey = name;
        }
      }
    });

    // Set a single primary key named `id` if no other has been defined
    if (!primaryKey) {
      primaryKey = 'id';

      var options = {primaryKey: true, defaultValue: uuid};
      this.reopen({id: key(options)});
      map.id = options;
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
