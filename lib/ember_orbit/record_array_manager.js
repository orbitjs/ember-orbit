/**
  @module ember-orbit
*/

import RecordArray from './record_arrays/record_array';
import FilteredRecordArray from './record_arrays/filtered_record_array';
import HasManyArray from './links/has_many_array';

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
   This method is invoked whenever data is changed in the context.

   It updates all record arrays that a record belongs to.

   To avoid thrashing, it only runs at most once per run loop.

   @method _processChanges
   @private
  */
  _processChanges: function() {
    forEach(this.changes, function(change) {
      this._processChange(change.record, change.operation);
    }, this);

    this.changes.length = 0;
  },

  _processChange: function(record, operation) {
    console.log('_processChange', record, operation);

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
      forEach(recordArrays, function(array) {
        array.removeObject(record);
      });
    }

    this.context.unload(record);
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
    var context = get(this, 'context');
    var linkType = get(context, 'schema').linkProperties(type, key).model;

    if (linkType) {
      var relatedRecord = context.retrieve(linkType, value);
      var links = get(record, key);

      if (links && relatedRecord) {
        links.addObject(relatedRecord);
      }
    }
  },

  _linkWasRemoved: function(record, key, value) {
    var type = record.constructor.typeKey;
    var context = get(this, 'context');
    var linkType = get(context, 'schema').linkProperties(type, key).model;

    if (linkType) {
      var relatedRecord = context.retrieve(linkType, value);
      var links = get(record, key);

      if (links && relatedRecord) {
        links.removeObject(relatedRecord);
      }
    }
  },

  /**
   Update an individual filter.

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

      if (!get(record, 'isDeleted')) {
        this.updateRecordArray(array, filter, type, record);
      }
    }
  },

  /**
   Create a `EO.ManyArray` for a type and list of record references, and index
   the `ManyArray` under each reference. This allows us to efficiently remove
   records from `ManyArray`s when they are deleted.

   @method createManyArray
   @param {EO.Model} record
   @param {String} key
   @return {EO.ManyArray}
  */
  createManyArray: function(record, key, relatedRecords) {
    relatedRecords = relatedRecords || Ember.A();

    var manyArray = HasManyArray.create({
      content: relatedRecords,
      context: this.context,
      _ownerId: record[get(this.context, 'idField')],
      _ownerType: record.constructor.typeKey,
      _linkKey: key
    });

    record._links = record._links || {};
    record._links[key] = manyArray;

    return manyArray;
  },

  /**
   Create a `EO.RecordArray` for a type and register it for updates.

   @method createRecordArray
   @param {String} type
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
    @param {Object} query (optional)
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
