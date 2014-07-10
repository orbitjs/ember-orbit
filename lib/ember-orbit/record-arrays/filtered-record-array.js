import RecordArray from "./record-array";

/**
 @module ember-orbit
 */

var get = Ember.get;

/**
 @class FilteredRecordArray
 @namespace EO
 @extends EO.RecordArray
 */
var FilteredRecordArray = RecordArray.extend({
  /**
   @method filterFunction
   @param {EO.Model} record
   @return {Boolean} `true` if the record should be in the array
   */
  filterFunction: null,

  replace: function() {
    var type = get(this, 'type').toString();
    throw new Error("The result of a client-side filter (on " + type + ") is immutable.");
  },

  /**
   @method updateFilter
   @private
   */
  _updateFilter: function() {
    var manager = get(this, 'manager');
    manager.updateFilter(this, get(this, 'type'), get(this, 'filterFunction'));
  },

  updateFilter: Ember.observer(function() {
    Ember.run.once(this, this._updateFilter);
  }, 'filterFunction')
});

export default FilteredRecordArray;
