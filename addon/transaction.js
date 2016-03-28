import Ember from 'ember';
import Store from './store';
import 'orbit-common/transaction';

const { getOwner } = Ember;

/**
 @module ember-orbit
 */

const Transaction = Store.extend({
  begin() {
    return this.get('orbitStore').begin();
  },

  commit() {
    return this.get('orbitStore').commit();
  }
});

Store.reopen({
  createTransaction(options = {}) {
    return Transaction.create(
      getOwner(this).ownerInjection(),
      { orbitStore: this.get('orbitStore').createTransaction(options) }
    );
  }
});

export default Transaction;
