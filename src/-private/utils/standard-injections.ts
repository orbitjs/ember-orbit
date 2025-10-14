import { getOwner } from '@ember/owner';
import type Owner from '@ember/owner';
import { getOrbitRegistry } from './orbit-registry.ts';
import type { RecordSourceSettings } from '@orbit/records';

export function applyStandardSourceInjections(
  injections: RecordSourceSettings,
): void {
  const owner = getOwner(injections) as Owner;
  const orbitRegistry = getOrbitRegistry(owner);
  injections.bucket = orbitRegistry.registrations.buckets['main'];
  injections.keyMap = orbitRegistry.services.dataKeyMap;
  injections.normalizer = orbitRegistry.services.dataNormalizer;
  injections.schema = orbitRegistry.services.dataSchema;
  injections.validatorFor = orbitRegistry.services.dataValidator;
}
