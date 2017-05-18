import OrbitStore from '@orbit/store';

export default {
  create(injections = {}) {
   return new OrbitStore(injections);
  }
}
