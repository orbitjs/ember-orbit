/**
  @module ember-orbit
*/

var get = Ember.get,
    set = Ember.set;

var forEach = Ember.EnumerableUtils.forEach;

/**
 A record array is an array that contains records of a certain type. The record
 array materializes records as needed when they are retrieved for the first
 time. You should not create record arrays yourself. Instead, an instance of
 `EO.RecordArray` or its subclasses will be returned by your application's store
 in response to queries.

 @class RecordArray
 @namespace EO
 @extends Ember.ArrayProxy
 @uses Ember.Evented
*/

var RecordArray = Ember.ArrayProxy.extend(Ember.Evented, {
  init: function() {
    this._super();
    this._recordsAdded(get(this, 'content'));
  },

  willDestroy: function() {
    this._recordsRemoved(get(this, 'content'));
    this._super();
  },

  /**
   The model type contained by this record array.

   @property type
   @type String
  */
  type: null,

  /**
   The context that created this record array.

   @property context
   @type EO.Context
  */
  context: null,

  /**
   Adds a record to the `RecordArray`.

   @method addObject
   @param {EO.Model} record
  */
  addObject: function(record) {
    get(this, 'content').addObject(record);
    this._recordAdded(record);
  },

  /**
   Removes a record from the `RecordArray`.

   @method removeObject
   @param {EO.Model} record
  */
  removeObject: function(record) {
    get(this, 'content').removeObject(record);
    this._recordRemoved(record);
  },

  _recordAdded: function(record) {
    this._recordArraysForRecord(record).add(this);
  },

  _recordRemoved: function(record) {
    this._recordArraysForRecord(record).remove(this);
  },

  _recordsAdded: function(records) {
    forEach(records, function(record) {
      this._recordAdded(record);
    }, this);
  },

  _recordsRemoved: function(records) {
    forEach(records, function(record) {
      this._recordRemoved(record);
    }, this);
  },

  _recordArraysForRecord: function(record) {
    record._recordArrays = record._recordArrays || Ember.OrderedSet.create();
    return record._recordArrays;
  }
});

export default RecordArray;
