import { assert } from '@ember/debug';
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
  nameOrTarget?: string | any,
  propertyKey?: string | symbol,
  descriptor?: PropertyDescriptor,
): any {
  // Direct decorator usage: @orbit
  if (propertyKey !== undefined) {
    const target = nameOrTarget;
    const propName = String(propertyKey);
    let serviceName: string;

    if (propName in orbitRegistry.services) {
      serviceName = propName;
    } else {
      serviceName = dasherize(propName);
    }

    const newDescriptor: PropertyDescriptor = {
      get() {
        const services = orbitRegistry.services;
        const service = services[serviceName as keyof typeof services];

        assert(
          `No orbit service named '${serviceName}' was found. Available services: ${Object.keys(services).join(', ')}`,
          service !== undefined,
        );

        return service;
      },
      configurable: true,
      enumerable: true,
    };

    if (descriptor) {
      Object.assign(descriptor, newDescriptor);
    } else {
      Object.defineProperty(target, propertyKey, newDescriptor);
    }
    return;
  }

  // Factory decorator usage: @orbit() or @orbit('name')
  const name = nameOrTarget as string | undefined;
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor?: PropertyDescriptor,
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

    const newDescriptor: PropertyDescriptor = {
      get() {
        const services = orbitRegistry.services;
        const service = services[serviceName as keyof typeof services];

        assert(
          `No orbit service named '${serviceName}' was found. Available services: ${Object.keys(services).join(', ')}`,
          service !== undefined,
        );

        return service;
      },
      configurable: true,
      enumerable: true,
    };

    if (descriptor) {
      Object.assign(descriptor, newDescriptor);
    } else {
      Object.defineProperty(target, propertyKey, newDescriptor);
    }
  };
}
