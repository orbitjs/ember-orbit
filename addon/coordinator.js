import OrbitCoordinator from 'orbit/coordinator';

export default Ember.Object.extend({
  orbitCoordinator: null,

  init() {
    this._super(...arguments);

    if (!this.orbitCoordinator) {
      this.orbitCoordinator = new OrbitCoordinator();
    }
  },

  addSource(source) {
    this.orbitCoordinator.addSource(source.orbitSource);
  },

  removeSource(source) {
    this.orbitCoordinator.removeSource(source.orbitSource);
  }
});
