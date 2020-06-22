import { defineProperty, computed } from '@ember/object';
import { dependentKeyCompat } from '@ember/object/compat';

class Runner {
  _validFlag = false;

  @computed('watcher')
  get runner() {
    return this.watcher;
  }

  // eslint-disable-next-line ember/require-computed-property-dependencies
  @computed('watcher')
  get _isValid() {
    // eslint-disable-next-line ember/no-side-effects
    return (this._validFlag = !this._validFlag);
  }

  isValid() {
    let pre = this._validFlag;
    this._isValid;
    return this._validFlag === pre;
  }
}

export function memoComputation(fn) {
  let obj = new Runner();

  defineProperty(obj, 'watcher', dependentKeyCompat({ get: fn }));

  return () => obj.runner;
}
