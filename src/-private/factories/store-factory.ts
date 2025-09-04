import Store, { type StoreSettings } from '../store.ts';
import type ApplicationInstance from '@ember/application/instance';
import { orbitRegistry } from '../system/ember-orbit-setup.ts';
import type MemorySource from '@orbit/memory';
import type { RecordSourceQueryOptions } from '@orbit/records';
import type { RequestOptions } from '@orbit/data';
import type {
  ModelAwareQueryBuilder,
  ModelAwareTransformBuilder,
} from '../utils/model-aware-types';
import type { RecordCacheUpdateDetails } from '@orbit/record-cache';

export default {
  create(injections: StoreSettings): Store {
    const app = orbitRegistry.application as ApplicationInstance;
    const orbitConfig = orbitRegistry.config;

    injections.source = app.lookup(
      `${orbitConfig.types.source}:store`,
    ) as MemorySource<
      RecordSourceQueryOptions,
      RequestOptions,
      ModelAwareQueryBuilder,
      ModelAwareTransformBuilder,
      unknown,
      RecordCacheUpdateDetails
    >;

    return Store.create(injections);
  },
};
