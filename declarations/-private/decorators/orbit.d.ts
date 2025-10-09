/**
 * Decorator that injects orbit services from the orbitRegistry
 * This provides an alternative to Ember's @service decorator that is decoupled from Ember's owner.
 *
 * Usage:
 * - @orbit declare dataCoordinator;
 * - @orbit('keyMap') declare myKeyMap;
 */
export declare function orbit(nameOrTarget?: unknown, propertyKey?: string | symbol): any;
//# sourceMappingURL=orbit.d.ts.map