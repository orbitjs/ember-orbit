import { orbitRegistry } from './orbit-registry.ts';
import type { RecordSourceSettings } from '@orbit/records';

export function applyStandardSourceInjections(
  injections: RecordSourceSettings,
): void {
  injections.bucket = orbitRegistry.registrations.buckets['main'];
  injections.keyMap = orbitRegistry.services.dataKeyMap;
  injections.normalizer = orbitRegistry.services.dataNormalizer;
  injections.schema = orbitRegistry.services.dataSchema;
  injections.validatorFor = orbitRegistry.services.dataValidator;
}
