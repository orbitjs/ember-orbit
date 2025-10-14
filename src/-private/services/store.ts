import { getOwner } from '@ember/owner';
import type Owner from '@ember/owner';
import Store, { type StoreSettings } from '../store.ts';
import type {
  ModelAwareQueryBuilder,
  ModelAwareTransformBuilder,
} from '../utils/model-aware-types.ts';
import { getOrbitRegistry } from '../utils/orbit-registry.ts';
import type { RequestOptions } from '@orbit/data';
import type MemorySource from '@orbit/memory';
import type { RecordCacheUpdateDetails } from '@orbit/record-cache';
import type { RecordSourceQueryOptions } from '@orbit/records';

export default {
  create(injections: StoreSettings): Store {
    const owner = getOwner(injections) as Owner;
    const orbitRegistry = getOrbitRegistry(owner);
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
