import { KeyMap } from '@orbit/data';

export default {
  create(injections = {}) {
    return new KeyMap(injections);
  }
};
