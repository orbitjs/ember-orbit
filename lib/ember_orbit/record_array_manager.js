/**
  @module ember-orbit
*/

import RecordArray from './record_arrays/record_array';
import FilteredRecordArray from './record_arrays/filtered_record_array';

var get = Ember.get,
    set = Ember.set;

var forEach = Ember.EnumerableUtils.forEach;

/**
  @class RecordArrayManager
  @namespace EO
  @private
  @extends Ember.Object
*/
var RecordArrayManager = Ember.Object.extend({
  init: function() {
    this.filteredRecordArrays = Ember.MapWithDefault.create({
      defaultValue: function() { return []; }
    });

    this.changedRecords = [];
  },

  recordDidChange: function(record) {
    if (this.changedRecords.push(record) !== 1) { return; }

    Ember.run.schedule('actions', this, this.updateRecordArrays);
  },

  recordArraysForRecord: function(record) {
    record._recordArrays = record._recordArrays || Ember.OrderedSet.create();
    return record._recordArrays;
  },

  /**
    This method is invoked whenever data is changed in the context.

    It updates all record arrays that a record belongs to.

    To avoid thrashing, it only runs at most once per run loop.

    @method updateRecordArrays
    @param {Class} type
    @param {Number|String} clientId
  */
  updateRecordArrays: function() {
    forEach(this.changedRecords, function(record) {
      if (get(record, 'isDeleted')) {
        this._recordWasDeleted(record);
      } else {
        this._recordWasChanged(record);
      }
    }, this);

    this.changedRecords.length = 0;
  },

  _recordWasDeleted: function (record) {
    var recordArrays = record._recordArrays;

    if (!recordArrays) { return; }

    forEach(recordArrays, function(array) {
      array.removeRecord(record);
    });

    this.context.unload(record);
  },

  _recordWasChanged: function (record) {
    var type = record.constructor.typeKey,
        recordArrays = this.filteredRecordArrays.get(type),
        filter;

    forEach(recordArrays, function(array) {
      filter = get(array, 'filterFunction');
      this.updateRecordArray(array, filter, type, record);
    }, this);
  },

  /**
    Update an individual filter.

    @method updateRecordArray
    @param {EO.FilteredRecordArray} array
    @param {Function} filter
    @param {Class} type
    @param {Number|String} clientId
  */
  updateRecordArray: function(array, filter, type, record) {
    var shouldBeInArray;

    if (!filter) {
      shouldBeInArray = true;
    } else {
      shouldBeInArray = filter(record);
    }

    var recordArrays = this.recordArraysForRecord(record);

    if (shouldBeInArray) {
      recordArrays.add(array);
      array.addRecord(record);
    } else if (!shouldBeInArray) {
      recordArrays.remove(array);
      array.removeRecord(record);
    }
  },

  /**
    This method is invoked if the `filterFunction` property is
    changed on a `EO.FilteredRecordArray`.

    It essentially re-runs the filter from scratch. This same
    method is invoked when the filter is created in th first place.

    @method updateFilter
    @param array
    @param type
    @param filter
  */
  updateFilter: function(array, type, filter) {
    var records = this.context.retrieve(type),
        record;

    for (var i=0, l=records.length; i<l; i++) {
      record = records[i];

      if (!get(record, 'isDeleted') && !get(record, 'isEmpty')) {
        this.updateRecordArray(array, filter, type, record);
      }
    }
  },

  /**
    Create a `EO.RecordArray` for a type and register it for updates.

    @method createRecordArray
    @param {Class} type
    @return {EO.RecordArray}
  */
  createRecordArray: function(type) {
    var array = RecordArray.create({
      type: type,
      content: Ember.A(),
      context: this.context
    });

    this.registerFilteredRecordArray(array, type);

    return array;
  },

  /**
    Create a `EO.FilteredRecordArray` for a type and register it for updates.

    @method createFilteredRecordArray
    @param {Class} type
    @param {Function} filter
    @param {Object} query (optional
    @return {EO.FilteredRecordArray}
  */
  createFilteredRecordArray: function(type, filter, query) {
    var array = FilteredRecordArray.create({
      query: query,
      type: type,
      content: Ember.A(),
      context: this.context,
      manager: this,
      filterFunction: filter
    });

    this.registerFilteredRecordArray(array, type, filter);

    return array;
  },

  /**
    Register a RecordArray for a given type to be backed by
    a filter function. This will cause the array to update
    automatically when records of that type change attribute
    values or states.

    @method registerFilteredRecordArray
    @param {EO.RecordArray} array
    @param {Class} type
    @param {Function} filter
  */
  registerFilteredRecordArray: function(array, type, filter) {
    var recordArrays = this.filteredRecordArrays.get(type);
    recordArrays.push(array);

    this.updateFilter(array, type, filter);
  },

  willDestroy: function(){
    this._super();

    flatten(values(this.filteredRecordArrays.values)).forEach(destroy);
  }
});

function values(obj) {
  var result = [];
  var keys = Ember.keys(obj);

  for (var i = 0; i < keys.length; i++) {
    result.push(obj[keys[i]]);
  }

  return result;
}

function destroy(entry) {
  entry.destroy();
}

function flatten(list) {
  var length = list.length;
  var result = Ember.A();

  for (var i = 0; i < length; i++) {
    result = result.concat(list[i]);
  }

  return result;
}

export default RecordArrayManager;
