import { getOwner } from '@ember/owner';
import type Owner from '@ember/owner';
import { getOrbitRegistry } from '../utils/orbit-registry.ts';

function getDescriptor(serviceName: string) {
  return {
    get() {
      const owner = getOwner(this) as Owner;
      const orbitRegistry = getOrbitRegistry(owner);
      const services = orbitRegistry.services;
      const service = services[serviceName as keyof typeof services];

      if (service === undefined) {
        throw new Error(
          `No orbit service named '${serviceName}' was found. Available services: ${Object.keys(services).join(', ')}`,
        );
      }

      return service;
    },
    configurable: true,
    enumerable: true,
  };
}

/**
 * Decorator that injects orbit services from the orbitRegistry
 * This provides an alternative to Ember's @service decorator that is decoupled from Ember's owner.
 *
 * Usage:
 * - @orbit declare dataCoordinator;
 * - @orbit('keyMap') declare myKeyMap;
 */
export function orbit(
  nameOrTarget?: unknown,
  propertyKey?: string | symbol,
): any {
  // Direct decorator usage: @orbit
  if (propertyKey !== undefined) {
    return getDescriptor(String(propertyKey));
  }

  // Factory decorator usage: @orbit() or @orbit('name')
  const name = nameOrTarget as string | undefined;
  return function (_target: any, propertyKey: string | symbol) {
    return getDescriptor(name ?? String(propertyKey));
  };
}
