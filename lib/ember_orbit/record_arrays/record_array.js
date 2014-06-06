/**
  @module ember-orbit
*/

var get = Ember.get, set = Ember.set;

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
  /**
   The model type contained by this record array.

   @property type
   @type String
  */
  type: null,

  /**
   The array of client ids backing the record array. When a
   record is requested from the record array, the record
   for the client id at the same index is materialized, if
   necessary, by the store.

   @property content
   @type Ember.Array
  */
  content: null,

  /**
   The context that created this record array.

   @property context
   @type EO.Context
  */
  context: null,

  /**
   Retrieves an object from the content by index.

   @method objectAtContent
   @param {Number} index
   @return {EO.Model} record
  */
  objectAtContent: function(index) {
    var content = get(this, 'content');

    return content.objectAt(index);
  },

  /**
   Adds a record to the `RecordArray`.

   @method addRecord
   @param {EO.Model} record
  */
  addRecord: function(record) {
    get(this, 'content').addObject(record);
  },

  /**
   Removes a record from the `RecordArray`.

   @method removeRecord
   @param {EO.Model} record
  */
  removeRecord: function(record) {
    get(this, 'content').removeObject(record);
  },

  _dissociateFromOwnRecords: function() {
    var array = this;

    this.forEach(function(record) {
      var recordArrays = record._recordArrays;

      if (recordArrays) {
        recordArrays.remove(array);
      }
    });
  },

  willDestroy: function() {
    this._dissociateFromOwnRecords();
    this._super();
  }
});

export default RecordArray;
