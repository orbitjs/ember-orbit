import { assert } from '@ember/debug';
import { orbitRegistry, type ServicesMap } from '../utils/orbit-registry.ts';
import { dasherize } from '@orbit/serializers';

type ServiceNames = keyof ServicesMap;

function createOrbitDecorator<K extends ServiceNames>(serviceName: K) {
  return function <T extends object>(
    target: T,
    propertyKey: string | symbol,
    descriptor?: PropertyDescriptor,
  ): void {
    const newDescriptor: PropertyDescriptor = {
      get(this: T): ServicesMap[K] {
        const services = orbitRegistry.services;
        const service = services[serviceName];

        assert(
          `No orbit service named '${String(serviceName)}' was found. Available services: ${Object.keys(services).join(', ')}`,
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

/**
 * Decorator that injects orbit services from the orbitRegistry with automatic type inference
 * This provides an alternative to Ember's @service decorator that is decoupled from Ember's owner.
 *
 * Usage:
 * - @orbit declare schema: RecordSchema;
 * - @orbit('keyMap') declare myKeyMap: RecordKeyMap;
 */
export function orbit<T extends object>(
  target: T,
  propertyKey: string | symbol,
  descriptor?: PropertyDescriptor,
): void;
export function orbit<K extends ServiceNames>(name: K): PropertyDecorator;
export function orbit<T extends object, K extends ServiceNames>(
  targetOrName: T | K,
  propertyKey?: string | symbol,
  descriptor?: PropertyDescriptor,
): void | PropertyDecorator {
  // Direct usage: @orbit
  if (propertyKey !== undefined) {
    const target = targetOrName as T;
    const serviceName = dasherize(String(propertyKey)) as ServiceNames;
    return createOrbitDecorator(serviceName)(target, propertyKey, descriptor);
  }

  // Factory usage: @orbit('serviceName')
  const serviceName = targetOrName as K;
  return createOrbitDecorator(serviceName);
}
