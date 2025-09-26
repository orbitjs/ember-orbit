import Store, { type StoreSettings } from '../store.ts';
import { orbitRegistry } from '../system/ember-orbit-setup.ts';
import type {
  ModelAwareQueryBuilder,
  ModelAwareTransformBuilder,
} from '../utils/model-aware-types';
import type { RequestOptions } from '@orbit/data';
import type MemorySource from '@orbit/memory';
import type { RecordCacheUpdateDetails } from '@orbit/record-cache';
import type { RecordSourceQueryOptions } from '@orbit/records';

export default {
  create(injections: StoreSettings): Store {
    injections.source = orbitRegistry.registrations.sources[
      'store'
    ] as MemorySource<
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
