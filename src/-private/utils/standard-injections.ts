import { orbitRegistry } from './orbit-registry.ts';
import type { RecordSourceSettings } from '@orbit/records';

export function applyStandardSourceInjections(
  injections: RecordSourceSettings,
): void {
  injections.bucket = orbitRegistry.registrations.buckets['main'];
  injections.keyMap = orbitRegistry.services.keyMap;
  injections.normalizer = orbitRegistry.services.normalizer;
  injections.schema = orbitRegistry.services.schema;
  injections.validatorFor = orbitRegistry.services.validatorFor;
}
