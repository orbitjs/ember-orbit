import { buildRegistry } from 'ember-strict-application-resolver/build-registry';
import DataCoordinator from './services/data-coordinator.ts';
import Store from './services/store.ts';

export default buildRegistry({
  './services/data-coordinator': { default: DataCoordinator },
  './services/store': { default: Store },
});
