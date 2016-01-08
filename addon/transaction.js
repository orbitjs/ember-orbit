import Store from './store';
import 'orbit-common/transaction';

/**
 @module ember-orbit
 */

var Transaction = Store.extend({
  begin: function() {
    return this.get('orbitStore').begin();
  },

  commit: function() {
    return this.get('orbitStore').commit();
  }
});

Store.reopen({
  createTransaction: function(options = {}) {
    return Transaction.create({
      orbitStore: this.get('orbitStore').createTransaction(options),
      container: this.get('container')
    });
  }
});

export default Transaction;
