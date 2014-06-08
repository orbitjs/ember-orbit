var get = Ember.get,
    set = Ember.set;

var LinkProxyMixin = Ember.Mixin.create({
  context: null,
  _parentId: null,
  _parentType: null,
  _linkKey: null,
  promise: null,
  find: function() {
    var context = get(this, 'context');
    var promise = context.findLink.call(context,
      get(this, '_parentType'),
      get(this, '_parentId'),
      get(this, '_linkKey')
    );
    set(this, 'promise', promise);
    return promise;
  },
  then: function() {
    var promise = get(this, 'promise');
    if (!promise) promise = this.find();
    return promise.then.apply(promise, arguments);
  }
});

export default LinkProxyMixin;