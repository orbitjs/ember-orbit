/**
 @module ember-orbit
 */

var get = Ember.get;

var LinkProxyMixin = Ember.Mixin.create({
  store: null,

  _ownerId: null,

  _ownerType: null,

  _linkField: null,

  reload: function() {
    var store = get(this, 'store');
    var promise = store.findLinked.call(store,
      get(this, '_ownerType'),
      get(this, '_ownerId'),
      get(this, '_linkField')
    );
    return promise;
  }
});

export default LinkProxyMixin;
