import { assert } from '@ember/debug';
import type Owner from '@ember/owner';
import { createStore } from 'ember-primitives/store';
import type ModelFactory from '../model-factory.ts';
import type Store from '../store.ts';
import type { Coordinator, Strategy } from '@orbit/coordinator';
import type { Bucket } from '@orbit/core';
import type { Source } from '@orbit/data';
import type {
  RecordIdentity,
  RecordKeyMap,
  RecordNormalizer,
  RecordSchema,
  StandardRecordValidator,
  UninitializedRecord,
} from '@orbit/records';
import { camelize } from '@orbit/serializers';
import type { StandardValidator, ValidatorForFn } from '@orbit/validators';

export type ServicesMap = {
  dataCoordinator: Coordinator;
  dataKeyMap: RecordKeyMap;
  dataNormalizer: RecordNormalizer<string, RecordIdentity, UninitializedRecord>;
  dataSchema: RecordSchema;
  dataValidator: ValidatorForFn<StandardValidator | StandardRecordValidator>;
  store: Store;
};

export class OrbitRegistry {
  registrations: {
    buckets: Record<'main', Bucket>;
    models: Record<string, ModelFactory>;
    sources: Record<string, Source>;
    strategies: Record<string, Strategy>;
  } = {
    buckets: {} as Record<'main', Bucket>,
    models: {},
    sources: {},
    strategies: {},
  };
  services: ServicesMap = {} as ServicesMap;
  schemaVersion?: number;
  getRegisteredModels(): string[] {
    return Object.keys(this.registrations.models).map(camelize);
  }
}

export function getOrbitRegistry(owner: Owner) {
  assert(
    `expected key to be an owner`,
    typeof owner === 'object' && 'lookup' in owner,
  );
  return createStore(owner, OrbitRegistry);
}
