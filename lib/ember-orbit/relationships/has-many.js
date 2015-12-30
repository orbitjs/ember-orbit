const { ArrayProxy } = Ember;

export default ArrayProxy.extend({
  _store: null,
  _model: null,

  pushObject(record) {
    const store = this.get('_store');
    const model = this.get('_model');
    const relationship = this.get('_relationship');

    store.addToHasMany(model, relationship, record);
  },

  removeObject(record) {
    const store = this.get('_store');
    const model = this.get('_model');
    const relationship = this.get('_relationship');

    store.removeFromHasMany(model, relationship, record);
  }
});
