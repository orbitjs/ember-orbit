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

  createContext: function() {
    return Context.create({
      store: this
    });
  }
});

export default Store;
