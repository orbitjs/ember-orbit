import { tracked } from '@glimmer/tracking';
import { createCache, getValue } from '@glimmer/tracking/primitives/cache';

const values = new WeakMap<Cache<unknown>, unknown>();

export class Cache<T> {
  @tracked invalidate = 0;

  #value = createCache(() => {
    this.invalidate;
    if (values.has(this)) {
      return values.get(this);
    }
    return this.#getter();
  });
  #getter: () => T;

  constructor(getter: () => T) {
    this.#getter = getter;
  }

  get value(): T {
    return getValue(this.#value);
  }

  set value(value: T) {
    values.set(this, value);
    this.invalidate++;
  }

  notifyPropertyChange() {
    values.delete(this);
    this.invalidate++;
  }
}
