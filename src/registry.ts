import { buildRegistry } from 'ember-strict-application-resolver/build-registry';
import DataCoordinator from './services/data-coordinator.ts';
import DataKeyMap from './services/data-key-map.ts';
import DataNormalizer from './services/data-normalizer.ts';
import DataSchema from './services/data-schema.ts';
import DataValidator from './services/data-validator.ts';
import Store from './services/store.ts';

export default buildRegistry({
  './services/data-coordinator': { default: DataCoordinator },
  './services/data-key-map': { default: DataKeyMap },
  './services/data-normalizer': { default: DataNormalizer },
  './services/data-schema': { default: DataSchema },
  './services/data-validator': { default: DataValidator },
  './services/store': { default: Store },
});
