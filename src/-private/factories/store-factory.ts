import { getOwner } from '@ember/application';
import Store, { type StoreSettings } from '../store.ts';
import type ApplicationInstance from '@ember/application/instance';
import type { OrbitConfig } from '../../instance-initializers/ember-orbit-config.ts';
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
    const app = getOwner(injections) as ApplicationInstance;
    const orbitConfig = app.lookup('ember-orbit:config') as OrbitConfig;

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
