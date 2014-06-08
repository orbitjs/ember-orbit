var get = Ember.get,
    set = Ember.set;

var LinkProxyMixin = Ember.Mixin.create({
  context: null,

  _ownerId: null,

  _ownerType: null,

  _linkKey: null,

  find: function() {
    var context = get(this, 'context');
    var promise = context.findLink.call(context,
      get(this, '_ownerType'),
      get(this, '_ownerId'),
      get(this, '_linkKey')
    );
    return promise;
  }
});

export default LinkProxyMixin;