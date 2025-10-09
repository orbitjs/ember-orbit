import { orbitRegistry } from '../utils/orbit-registry.ts';
import { dasherize } from '@orbit/serializers';

/**
 * Decorator that injects orbit services from the orbitRegistry
 * This provides an alternative to Ember's @service decorator that is decoupled from Ember's owner.
 *
 * Usage:
 * - @orbit declare dataCoordinator;
 * - @orbit('keyMap') declare myKeyMap;
 */
export function orbit(
  nameOrTarget: string | any,
  propertyKey?: string | symbol,
  descriptor?: PropertyDescriptor,
): any {
  // Direct decorator usage: @orbit
  if (propertyKey !== undefined && descriptor !== undefined) {
    const propName = String(propertyKey);
    const serviceName = propName; // Always use exact property name for now

    Object.assign(descriptor, {
      get() {
        const services = orbitRegistry.services;
        const service = services[serviceName as keyof typeof services];

        if (service === undefined) {
          console.log('Service lookup failed for:', serviceName);
          console.log('Available services:', Object.keys(services));
          throw new Error(
            `No orbit service named '${serviceName}' was found. Available services: ${Object.keys(services).join(', ')}`,
          );
        }

        return service;
      },
      configurable: true,
      enumerable: true,
    });
    return;
  }

  // Factory decorator usage: @orbit() or @orbit('name')
  const name = nameOrTarget as string | undefined;
  return function (
    _target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ): void {
    let serviceName: string;

    if (name) {
      serviceName = name;
    } else {
      const propName = String(propertyKey);
      if (propName in orbitRegistry.services) {
        serviceName = propName;
      } else {
        serviceName = dasherize(propName);
      }
    }

    Object.assign(descriptor, {
      get() {
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
    });
  };
}
