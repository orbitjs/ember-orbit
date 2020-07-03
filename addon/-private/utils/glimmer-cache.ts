import Ember from 'ember';

export function createCache<T>(fn: () => T): object {
  return (Ember as any)._createCache(fn) as object;
}

export function getValue<T>(cache: object): T {
  return (Ember as any)._cacheGetValue(cache) as T;
}
