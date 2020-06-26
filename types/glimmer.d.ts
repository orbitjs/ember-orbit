declare module '@glimmer/env' {
  export const DEBUG: boolean;
}

declare module '@glimmer/tracking/primitives/cache' {
  export function createCache<T>(cb: () => T): object;
  export function getValue<T>(cache: object): T;
}
