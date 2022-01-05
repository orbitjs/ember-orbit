import { getOwner } from '@ember/application';
import Store, { StoreSettings } from '../store';

export default {
  create(injections: StoreSettings): Store {
    const app = getOwner(injections);
    const orbitConfig = app.lookup('ember-orbit:config');

    injections.source = app.lookup(`${orbitConfig.types.source}:store`);

    return Store.create(injections);
  }
};
