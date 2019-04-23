import EmberError from '@ember/error';
import { assert } from '@ember/debug';
import { empty } from '@ember/object/computed';
import Evented from '@ember/object/evented';
import EmberObject, { set, get, computed } from '@ember/object';
import HasMany from './relationships/has-many';

const Model = EmberObject.extend(Evented, {
  id: null,
  type: null,
  _store: null,

  init() {
    this._super();
    this.identity = { id: this.id, type: this.type };
  },

  disconnected: empty('_store'),

  getKey(field) {
    const cache = get(this, '_storeOrError.cache');
    return cache.retrieveKey(this.identity, field);
  },

  replaceKey(field, value, options) {
    const store = get(this, '_storeOrError');
    store.update(t => t.replaceKey(this.identity, field, value), options);
  },

  getAttribute(field) {
    const cache = get(this, '_storeOrError.cache');
    return cache.retrieveAttribute(this.identity, field);
  },

  replaceAttribute(attribute, value, options) {
    const store = get(this, '_storeOrError');
    store.update(t => t.replaceAttribute(this.identity, attribute, value), options);
  },

  getData() {
    const cache = get(this, '_storeOrError.cache');
    return cache.retrieveRecordData(this.type, this.id);
  },

  getRelatedRecord(relationship) {
    const cache = get(this, '_storeOrError.cache');
    return cache.retrieveRelatedRecord(this.identity, relationship);
  },

  replaceRelatedRecord(relationship, relatedRecord, options) {
    const store = get(this, '_storeOrError');
    const relatedRecordIdentity = relatedRecord ? relatedRecord.identity : null;
    store.update(t => t.replaceRelatedRecord(this.identity, relationship, relatedRecordIdentity), options);
  },

  getRelatedRecords(field) {
    const store = get(this, '_storeOrError');
    return HasMany.create({
      _store: store,
      _model: this,
      _relationship: field
    });
  },

  replaceAttributes(properties, options) {
    const store = get(this, '_storeOrError');
    const keys = Object.keys(properties);
    return store.update(t => keys.map(key => t.replaceAttribute(this.identity, key, properties[key])), options)
      .then(() => this);
  },

  remove(options) {
    const store = get(this, '_storeOrError');
    return store.update(t => t.removeRecord(this.identity), options);
  },

  disconnect() {
    set(this, '_store', null);
  },

  willDestroy() {
    // console.debug('Model#willDestroy', this.identity);

    if (this.trigger) {
      this.trigger('didUnload');
    }

    this._super.apply(this, arguments);

    const cache = get(this, '_storeOrError.cache');
    if (cache) { cache.unload(this); }
  },

  _storeOrError: computed('_store', function() {
    const store = get(this, '_store');

    if (!store) {
      throw new EmberError('record has been removed from Store');
    }

    return store;
  })
});

Model.reopenClass({
  create(injections) {
    assert("You should not call `create` on a model. Instead, call `store.addRecord` with the attributes you would like to set.", injections._store);
    return this._super(...arguments);
  },

  keys: computed(function() {
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

  attributes: computed(function() {
    const map = {};

    this.eachComputedProperty(function(name, meta) {
      if (meta.isAttribute) {
        meta.name = name;
        map[name] = meta.options;
      }
    });

    return map;
  }),

  relationships: computed(function() {
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
