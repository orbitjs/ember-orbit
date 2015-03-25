import RecordArray from './record-arrays/record-array';
import FilteredRecordArray from './record-arrays/filtered-record-array';

/**
 @module ember-orbit
 */

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

    this.changes = [];
  },

  recordDidChange: function(record, operation) {
    if (this.changes.push({record: record, operation: operation}) !== 1) { return; }
    Ember.run.schedule('actions', this, this._processChanges);
  },

  /**
   @method _processChanges
   @private
   */
  _processChanges: function() {
    var change;

    while (change = this.changes.shift()) {
      this._processChange(change.record, change.operation);
    }
  },

  _processChange: function(record, operation) {
//    console.log('_processChange', record, operation);

    var path = operation.path,
        op = operation.op,
        value = operation.value;

    if (path.length === 2) {
      if (op === 'add') {
        this._recordWasChanged(record);
        return;

      } else if (op === 'remove') {
        this._recordWasDeleted(record);
        return;
      }

    } else if (path.length === 3 || path.length === 4) {
      this._recordWasChanged(record);
      return;

    } else if (path.length === 5) {
      if (op === 'add') {
        this._linkWasAdded(record, path[3], path[4]);
        return;

      } else if (op === 'remove') {
        this._linkWasRemoved(record, path[3], path[4]);
        return;
      }
    }

    console.log('!!!! unhandled change', path.length, operation);
  },

  _recordWasDeleted: function(record) {
    var recordArrays = record._recordArrays;

    if (recordArrays) {
      recordArrays = recordArrays.toArray();

      forEach(recordArrays, function(array) {
        array.removeObject(record);
      });
    }

    record.destroy();
  },

  _recordWasChanged: function(record) {
    var type = record.constructor.typeKey,
        recordArrays = this.filteredRecordArrays.get(type),
        filter;

    if (recordArrays) {
      forEach(recordArrays, function(array) {
        filter = get(array, 'filterFunction');
        this.updateRecordArray(array, filter, type, record);
      }, this);
    }
  },

  _linkWasAdded: function(record, key, value) {
    var type = record.constructor.typeKey;
    var store = get(this, 'store');
    var linkType = get(store, 'schema').linkProperties(type, key).model;

    if (linkType) {
      var relatedRecord = store.retrieve(linkType, value);
      var links = get(record, key);

      if (links && relatedRecord) {
        links.addObject(relatedRecord);
      }
    }
  },

  _linkWasRemoved: function(record, key, value) {
    var type = record.constructor.typeKey;
    var store = get(this, 'store');
    var linkType = get(store, 'schema').linkProperties(type, key).model;

    if (linkType) {
      var relatedRecord = store.retrieve(linkType, value);
      var links = get(record, key);

      if (links && relatedRecord) {
        links.removeObject(relatedRecord);
      }
    }
  },

  /**
   @method updateRecordArray
   @param {EO.RecordArray} array
   @param {Function} filter
   @param {String} type
   @param {EO.Model} record
   */
  updateRecordArray: function(array, filter, type, record) {
    var shouldBeInArray;

    if (!filter) {
      shouldBeInArray = true;
    } else {
      shouldBeInArray = filter(record);
    }

    if (shouldBeInArray) {
      array.addObject(record);
    } else {
      array.removeObject(record);
    }
  },

  /**
   @method updateFilter
   @param array
   @param type
   @param filter
   */
  updateFilter: function(array, type, filter) {
    var records = this.store.retrieve(type),
        record;

    for (var i=0, l=records.length; i<l; i++) {
      record = records[i];

      if (!get(record, 'isDeleted')) {
        this.updateRecordArray(array, filter, type, record);
      }
    }
  },

  /**
   @method createRecordArray
   @param {String} type
   @return {EO.RecordArray}
   */
  createRecordArray: function(type) {
    var array = RecordArray.create({
      type: type,
      content: Ember.A(),
      store: this.store
    });

    this.registerFilteredRecordArray(array, type);

    return array;
  },

  /**
   @method createFilteredRecordArray
   @param {Class} type
   @param {Function} filter
   @param {Object} query (optional)
   @return {EO.FilteredRecordArray}
   */
  createFilteredRecordArray: function(type, filter, query) {
    var array = FilteredRecordArray.create({
      query: query,
      type: type,
      content: Ember.A(),
      store: this.store,
      manager: this,
      filterFunction: filter
    });

    this.registerFilteredRecordArray(array, type, filter);

    return array;
  },

  /**
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

    var filteredRecordArraysValues = [];
    this.filteredRecordArrays.forEach(function(value) {
      filteredRecordArraysValues.push(value);
    });

    flatten(values(filteredRecordArraysValues)).forEach(destroy);
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
