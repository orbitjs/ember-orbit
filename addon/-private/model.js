import HasMany from './relationships/has-many';

const { get, set } = Ember;

const Model = Ember.Object.extend(Ember.Evented, {
  id: null,
  type: null,
  _store: null,

  init() {
    this._super();
    this.identity = { id: this.id, type: this.type };
  },

  disconnected: Ember.computed.empty('_store'),

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

  getRelatedRecord(relationship) {
    const cache = get(this, '_storeOrError.cache');
    return cache.retrieveRelatedRecord(this.identity, relationship);
  },

  replaceRelatedRecord(relationship, record, options) {
    const store = get(this, '_storeOrError');
    store.update(t => t.replaceRelatedRecord(this.identity, relationship, record), options);
  },

  getRelatedRecords(field) {
    const store = get(this, '_storeOrError');
    return HasMany.create({
      _store: store,
      _model: this,
      _relationship: field
    });
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
  _create(id, store) {
    return _create.call(this, { id, type: this.typeKey, _store: store });
  },

  create() {
    throw new Ember.Error("You should not call `create` on a model. Instead, call `store.addRecord` with the attributes you would like to set.");
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
