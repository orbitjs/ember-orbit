import RecordArray from "./../record-arrays/record-array";
import LinkProxyMixin from './link-proxy-mixin';

/**
 @module ember-orbit
 */

var get = Ember.get;

/**
 A `HasManyArray` is a `RecordArray` that represents the contents of a has-many
 relationship.

 @class HasManyArray
 @namespace EO
 @extends EO.RecordArray
 */
var HasManyArray = RecordArray.extend(LinkProxyMixin, {

  arrayContentWillChange: function(index, removed) {
    var store = get(this, 'store');
    var ownerType = get(this, '_ownerType');
    var ownerId = get(this, '_ownerId');
    var linkField = get(this, '_linkField');
    var content = get(this, 'content');
    var record, recordId;

    for (var i = index; i < index + removed; i++) {
      record = content.objectAt(i);
      recordId = record.primaryId;
      store.removeLink(ownerType, ownerId, linkField, recordId);
    }

    return this._super.apply(this, arguments);
  },

  arrayContentDidChange: function(index, removed, added) {
    this._super.apply(this, arguments);

    var store = get(this, 'store');
    var ownerType = get(this, '_ownerType');
    var ownerId = get(this, '_ownerId');
    var linkField = get(this, '_linkField');
    var content = get(this, 'content');
    var record, recordId;

    for (var i = index; i < index + added; i++) {
      record = content.objectAt(i);
      recordId = record.primaryId;
      store.addLink(ownerType, ownerId, linkField, recordId);
    }
  }

});

export default HasManyArray;
