
import { assert } from '@ember/debug';
import { createStore } from 'ember-primitives/store';
import { camelize } from '@orbit/serializers';

class OrbitRegistry {
  registrations = {
    buckets: {},
    models: {},
    sources: {},
    strategies: {}
  };
  services = {};
  schemaVersion;
  getRegisteredModels() {
    return Object.keys(this.registrations.models).map(camelize);
  }
}
function getOrbitRegistry(owner) {
  assert(`expected key to be an owner`, typeof owner === 'object' && 'lookup' in owner);
  return createStore(owner, OrbitRegistry);
}

export { getOrbitRegistry as g };
//# sourceMappingURL=orbit-registry-BOeq-4ry.js.map
