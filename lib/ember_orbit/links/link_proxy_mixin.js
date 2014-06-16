/**
 @module ember-orbit
 */

var get = Ember.get,
    set = Ember.set;

var LinkProxyMixin = Ember.Mixin.create({
  store: null,

  _ownerId: null,

  _ownerType: null,

  _linkKey: null,

  find: function() {
    var store = get(this, 'store');
    var promise = store.findLink.call(store,
      get(this, '_ownerType'),
      get(this, '_ownerId'),
      get(this, '_linkKey')
    );
    return promise;
  }
});

export default LinkProxyMixin;