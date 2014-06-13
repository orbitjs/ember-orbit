import RecordArray from "./../record_arrays/record_array";
import LinkProxyMixin from './link_proxy_mixin';

var get = Ember.get,
    set = Ember.set;

var forEach = Ember.EnumerableUtils.forEach;

/**
 @module ember-orbit
*/

/**
 A `HasManyArray` is a `RecordArray` that represents the contents of a has-many
 relationship.

 @class HasManyArray
 @namespace EO
 @extends EO.RecordArray
*/
var HasManyArray = RecordArray.extend(LinkProxyMixin, {

  arrayContentWillChange: function(index, removed, added) {
    var context = get(this, 'context');
    var idField = get(context, 'idField');
    var ownerType = get(this, '_ownerType');
    var ownerId = get(this, '_ownerId');
    var linkKey = get(this, '_linkKey');
    var content = get(this, 'content');
    var record, recordId;

    for (var i = index; i < index + removed; i++) {
      record = content.objectAt(i);
      recordId = get(record, idField);
      context.removeLink(ownerType, ownerId, linkKey, recordId);
    }

    return this._super.apply(this, arguments);
  },

  arrayContentDidChange: function(index, removed, added) {
    this._super.apply(this, arguments);

    var context = get(this, 'context');
    var idField = get(context, 'idField');
    var ownerType = get(this, '_ownerType');
    var ownerId = get(this, '_ownerId');
    var linkKey = get(this, '_linkKey');
    var content = get(this, 'content');
    var record, recordId;

    for (var i = index; i < index + added; i++) {
      record = content.objectAt(i);
      recordId = get(record, idField);
      context.addLink(ownerType, ownerId, linkKey, recordId);
    }
  }

});

export default HasManyArray;
