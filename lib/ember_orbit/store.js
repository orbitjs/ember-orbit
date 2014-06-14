import Context from './context';

var get = Ember.get,
    set = Ember.set;

var Store = Ember.Object.extend({
  schema: null,

  /**
   @method init
   @private
   */
  init: function() {
    this._super.apply(this, arguments);

    if (!get(this, 'schema')) {
      var container = get(this, 'container');
      set(this, 'schema', container.lookup('schema:main'));
    }
  },

  modelFor: function(key) {
    var model;

    if (typeof key === 'string') {
      var normalizedKey = this.container.normalize('model:' + key);

      model = this.container.lookupFactory(normalizedKey);
      if (!model) {
        throw new Ember.Error("No model was found for '" + key + "'");
      }

      model.typeKey = normalizedKey.split(':', 2)[1];

    } else {
      // A model was supplied
      model = key;
    }

    return model;
  },

  createContext: function() {
    return Context.create({
      store: this
    });
  }
});

export default Store;
