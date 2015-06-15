/**
 @module ember-orbit
 */

var get = Ember.get;

/**
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
   The store that created this record array.

   @property store
   @type EO.Store
   */
  store: null,

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
    this._recordArraysForRecord(record).delete(this);
  },

  _recordsAdded: function(records) {
    records.forEach(function(record) {
      this._recordAdded(record);
    }, this);
  },

  _recordsRemoved: function(records) {
    records.forEach(function(record) {
      this._recordRemoved(record);
    }, this);
  },

  _recordArraysForRecord: function(record) {
    record._recordArrays = record._recordArrays || Ember.OrderedSet.create();
    return record._recordArrays;
  }
});

export default RecordArray;
