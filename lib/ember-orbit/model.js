import HasMany from './relationships/has-many';
import key from 'ember-orbit/fields/key';
import { uuid } from 'orbit/lib/uuid';
import { queryExpression as oqe } from 'orbit-common/oql/expressions';

/**
 @module ember-orbit
 */

const get = Ember.get;

/**
 @class Model
 @namespace EO
 */
const Model = Ember.Object.extend(Ember.Evented, {
  primaryId: null,
  _store: null,

  getKey: function(field) {
    const store = get(this, '_store');
    const pk = get(this.constructor, 'primaryKey');

    if (pk === field) {
      return this.primaryId;
    } else {
      const type = get(this.constructor, 'typeKey');
      return store.retrieveKey(type, this.primaryId, field);
    }
  },

  getAttribute(field) {
    const cache = get(this, '_store.cache');
    return cache.getAttribute(this, field);
  },

  getHasOne(relationship) {
    const cache = get(this, '_store.cache');
    return cache.getHasOne(this, relationship);
  },

  replaceHasOne(relationship, value) {
    const store = get(this, '_store');
    store.replaceHasOne(this, relationship, value);
  },

  getHasMany(field) {
    const store = get(this, '_store');
    const cache = get(store, 'cache');
    const type = get(this.constructor, 'typeKey');
    const id = get(this, 'id');

    const query = {oql: oqe('relatedRecords', type, id, field)};

    return HasMany.create({
      content: cache.liveQuery(query),
      _store: store,
      _model: this,
      _relationship: field
    });
  },

  setAttribute(attribute, value) {
    const store = get(this, '_store');

    store.replaceAttribute(this, attribute, value);
  },

  remove() {
    const store = get(this, '_store');
    return store.removeRecord(this);
  },

  willDestroy: function() {
    if (this.trigger) {
      this.trigger('didUnload');
    }

    this._super.apply(this, arguments);

    const store = get(this, '_store');
    if (store) {
      const type = get(this.constructor, 'typeKey');
      store.unload(type, this.primaryId);
    }
  }
});

const _create = Model.create;

Model.reopenClass({
  _create: function(id, store) {
    return _create.call(this, {primaryId: id, _store: store});
  },

  create: function() {
    throw new Ember.Error("You should not call `create` on a model. Instead, call `store.add` with the attributes you would like to set.");
  },

  primaryKey: Ember.computed('keys', function() {
    if (arguments.length > 1) {
      throw new Ember.Error("You should not set `primaryKey` on a model. Instead, define a `key` with the options `{primaryKey: true, defaultValue: idGenerator}`.");
    }

    const keys = get(this, 'keys');
    const keyNames = Object.keys(keys);
    for (const k in keyNames) {
      const keyName = keyNames[k];
      if (keys[keyName].primaryKey) {
        return keyName;
      }
    }
  }),

  keys: Ember.computed(function() {
    const map = {};
    const _this = this;
    let primaryKey;

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

      const options = {primaryKey: true, defaultValue: uuid};
      this.reopen({id: key(options)});
      map.id = options;
    }

    return map;
  }),

  attributes: Ember.computed(function() {
    const map = {};

    this.eachComputedProperty(function(name, meta) {
      if (meta.isAttribute) {
        meta.name = name;
        map[name] = meta.options;
      }
    });

    return map;
  }),

  relationships: Ember.computed(function() {
    const map = {};

    this.eachComputedProperty(function(name, meta) {
      if (meta.isRelationship) {
        meta.name = name;
        map[name] = meta.options;
      }
    });

    return map;
  })
});

export default Model;
