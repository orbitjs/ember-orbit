import { assert } from '@ember/debug';
import type {
  OrbitServiceName,
  OrbitServiceRegistry,
} from '../types/service-registry.ts';
import { orbitRegistry } from '../utils/orbit-registry.ts';
import { dasherize } from '@orbit/serializers';

/**
 * Decorator that injects orbit services from the orbitRegistry with automatic type inference
 * This provides an alternative to Ember's @service decorator that is decoupled from Ember's owner
 *
 * @param name - The name of the service to inject (optional, defaults to property name)
 */
export function orbit<K extends OrbitServiceName>(
  name: K,
): <T, V extends OrbitServiceRegistry[K]>(
  target: T,
  propertyKey: string | symbol,
) => void;

export function orbit(): <
  T,
  K extends OrbitServiceName,
  V extends OrbitServiceRegistry[K],
>(
  target: T,
  propertyKey: K,
) => void;

export function orbit<K extends OrbitServiceName>(name?: K) {
  return function (target: any, propertyKey: string | symbol, descriptor) {
    // If no name provided, convert camelCase property name to kebab-case
    const serviceName = (name ||
      dasherize(String(propertyKey))) as OrbitServiceName;

    // Return a property descriptor for the class field
    Object.assign(descriptor, {
      get() {
        const services = orbitRegistry.registrations.services;
        const service = services[serviceName];

        assert(
          `No orbit service named '${serviceName}' was found. Available services: ${Object.keys(services).join(', ')}`,
          service !== undefined,
        );

        return service;
      },
      configurable: true,
      enumerable: true,
    });
  };
}
