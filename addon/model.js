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
  _id: null,
  _store: null,
  disconnected: Ember.computed.empty('_store'),

  getKey(field) {
    const cache = get(this, '_storeOrError.cache');

    if ('id' === field) {
      return this._id;
    } else {
      return cache.retrieveKey(this, field);
    }
  },

  replaceKey(field, value) {
    const store = get(this, '_storeOrError');
    store.replaceKey(this, field, value);
  },

  getAttribute(field) {
    const cache = get(this, '_storeOrError.cache');
    return cache.retrieveAttribute(this, field);
  },

  getHasOne(relationship) {
    const cache = get(this, '_storeOrError.cache');
    return cache.retrieveHasOne(this, relationship);
  },

  replaceHasOne(relationship, value) {
    const store = get(this, '_storeOrError');
    store.replaceHasOne(this, relationship, value);
  },

  getHasMany(field) {
    const store = get(this, '_storeOrError');
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

  replaceAttribute(attribute, value) {
    const store = get(this, '_storeOrError');

    store.replaceAttribute(this, attribute, value);
  },

  remove() {
    const store = get(this, '_storeOrError');
    return store.removeRecord(this);
  },

  disconnect() {
    this.set('_store', null);
  },

  willDestroy() {
    if (this.trigger) {
      this.trigger('didUnload');
    }

    this._super.apply(this, arguments);

    const cache = get(this, '_storeOrError.cache');
    if (cache) { cache.unload(this); }
  },

  _storeOrError: Ember.computed('_store', function() {
    const store = this.get('_store');

    if (!store) throw new Ember.Error('record has been removed from Store');

    return store;
  })
});

const _create = Model.create;

Model.reopenClass({
  _create: function(id, store) {
    return _create.call(this, {_id: id, _store: store});
  },

  create: function() {
    throw new Ember.Error("You should not call `create` on a model. Instead, call `store.add` with the attributes you would like to set.");
  },

  keys: Ember.computed(function() {
    const map = {};
    const _this = this;

    _this.eachComputedProperty(function(name, meta) {
      if (meta.isKey) {
        meta.name = name;
        map[name] = meta.options;
      }
    });

    const options = {defaultValue: uuid};
    this.reopen({id: key(options)});
    map.id = options;

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
