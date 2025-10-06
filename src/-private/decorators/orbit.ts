import { assert } from '@ember/debug';
import type {
  OrbitServiceName,
  OrbitServiceRegistry,
} from '../types/service-registry.ts';
import { orbitRegistry } from '../utils/orbit-registry.ts';

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
  return function (target: any, propertyKey: string) {
    const serviceName = name || propertyKey;

    // Create a getter that lazily resolves the service
    Object.defineProperty(target, propertyKey, {
      get() {
        const services = orbitRegistry.registrations.services as Record<
          string,
          any
        >;
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
