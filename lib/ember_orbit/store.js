import Schema from 'orbit_common/schema';
import MemorySource from 'orbit_common/memory_source';

var Store = Ember.Object.extend({
  /**
   @method init
   @private
   */
  init: function() {
    this._source = new MemorySource(new Schema());
  }
});

export default Store;
