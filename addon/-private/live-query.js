import { computed, set, get } from '@ember/object';
import { isArray } from '@ember/array';
import ReadOnlyArrayProxy from './system/read-only-array-proxy';

export default ReadOnlyArrayProxy.extend({
  _content: null,

  init(...args) {
    this._super(...args);
    this._invalidatelistener = this.invalidate.bind(this);
    this._sourceCache.on('patch', this._invalidatelistener);
    this._sourceCache.on('reset', this._invalidatelistener);
  },

  willDestroy(...args) {
    this._super(...args);
    this._sourceCache.off('patch', this._invalidatelistener);
    this._sourceCache.off('reset', this._invalidatelistener);
    this._invalidatelistener = null;
},

  invalidate() {
    set(this, '_content', null);
  },

  content: computed('_content', {
    get() {
      if (get(this, '_content') === null) {
        let result = this._sourceCache.query(this._query);
        let content = this._identityMap.lookupQueryResult(this._query, result);
        if (content) {
          if (!isArray(content)) {
            content = [content];
          }
        } else {
          content = [];
        }
        // eslint-disable-next-line ember/no-side-effects
        set(this, '_content', content);
      }
      return this._content;
    }
  })
});
