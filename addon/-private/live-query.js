import Ember from 'ember';
import ReadOnlyArrayProxy from './system/read-only-array-proxy';

const { get, set, computed, isArray } = Ember;

export default ReadOnlyArrayProxy.extend({
  _sourceCache: null,
  _query: null,
  _identityMap: null,
  _content: null,

  init(...args) {
    this._super(...args);
    this._sourceCache.on('patch', this.invalidate, this);
    this._sourceCache.on('reset', this.invalidate, this);
  },

  willDestroy() {
    this._super(...args);
    this._sourceCache.off('patch', this.invalidate, this);
    this._sourceCache.off('reset', this.invalidate, this);
  },

  invalidate() {
    set(this, '_content', null);
  },

  content: computed('_content', {
    get() {
      if (get(this, '_content') === null) {
        let results = this._sourceCache.query(this._query);

        let content;
        if (isArray(results)) {
          content = results.map(r => this._identityMap.lookup(r))
        } else if (typeof results === 'object') {
          content = Object.keys(results).map(r => this._identityMap.lookup(results[r]))
        }
        set(this, '_content', content);
      }
      return this._content;
    }
  })
});
