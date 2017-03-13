import { KeyMap as OrbitKeyMap } from '@orbit/data';

export default Ember.Object.extend({
  orbitKeyMap: null,

  init() {
    this._super(...arguments);

    if (!this.orbitKeyMap) {
      this.orbitKeyMap = new OrbitKeyMap();
    }
  }
});
