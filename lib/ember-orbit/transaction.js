import Store from './store';
import OCTransaction from 'orbit-common/transaction';

/**
 @module ember-orbit
 */

var get = Ember.get;
var set = Ember.set;

var Transaction = Store.extend({
  orbitSourceClass: OCTransaction,
  baseStore: null,

  init: function() {
    var baseStore = get(this, 'baseStore');

    this.orbitSourceOptions = this.orbitSourceOptions || {};
    this.orbitSourceOptions.baseSource = baseStore.orbitSource;

    set(this, 'schema', get(baseStore, 'schema'));

    this._super();
  },

  begin: function() {
    return this.orbitSource.begin();
  },

  commit: function() {
    return this.orbitSource.commit();
  }
});

Store.reopen({
  createTransaction: function() {
    return Transaction.create({
      baseStore: this
    });
  }
});

export default Transaction;
