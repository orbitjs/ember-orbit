import HasMany from './relationships/has-many';
import { uuid } from 'orbit/lib/uuid';
import {
  replaceKey,
  replaceAttribute,
  replaceHasOne
} from 'orbit-common/transform/operators';

/**
 @module ember-orbit
 */

const { get, set } = Ember;

/**
 @class Model
 @namespace EO
 */
const Model = Ember.Object.extend(Ember.Evented, {
  id: null,
  type: null,
  _store: null,
  disconnected: Ember.computed.empty('_store'),

  getKey(field) {
    const cache = get(this, '_storeOrError.cache');
    return cache.retrieveKey(this, field);
  },

  replaceKey(field, value) {
    const store = get(this, '_storeOrError');
    store.update(replaceKey(this, field, value));
  },

  getAttribute(field) {
    const cache = get(this, '_storeOrError.cache');
    return cache.retrieveAttribute(this, field);
  },

  replaceAttribute(attribute, value) {
    const store = get(this, '_storeOrError');
    store.update(replaceAttribute(this, attribute, value));
  },

  getHasOne(relationship) {
    const cache = get(this, '_storeOrError.cache');
    return cache.retrieveHasOne(this, relationship);
  },

  replaceHasOne(relationship, record) {
    const store = get(this, '_storeOrError');
    store.update(replaceHasOne(this, relationship, record));
  },

  getHasMany(field) {
    const store = get(this, '_storeOrError');
    return HasMany.create({
      _store: store,
      _model: this,
      _relationship: field
    });
  },

  remove() {
    const store = get(this, '_storeOrError');
    return store.removeRecord(this);
  },

  disconnect() {
    set(this, '_store', null);
  },

  willDestroy() {
    // console.debug('willDestroy hook');
    if (this.trigger) {
      this.trigger('didUnload');
    }

    this._super.apply(this, arguments);

    const cache = get(this, '_storeOrError.cache');
    if (cache) { cache.unload(this); }
  },

  _storeOrError: Ember.computed('_store', function() {
    const store = get(this, '_store');

    if (!store) {
      throw new Ember.Error('record has been removed from Store');
    }

    return store;
  })
});

const _create = Model.create;

Model.reopenClass({
  _create: function(id, store) {
    return _create.call(this, { id, type: this.typeKey, _store: store });
  },

  create: function() {
    throw new Ember.Error("You should not call `create` on a model. Instead, call `store.addRecord` with the attributes you would like to set.");
  },

  id: Ember.computed(function() {
    return {
      defaultValue: uuid
    };
  }),

  keys: Ember.computed(function() {
    const map = {};
    const _this = this;

    _this.eachComputedProperty(function(name, meta) {
      if (meta.isKey) {
        meta.name = name;
        map[name] = meta.options;
      }
    });

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
