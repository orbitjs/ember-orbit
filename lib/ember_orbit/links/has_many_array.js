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
    var owner = context.retrieve(get(this, '_parentType'), get(this, '_parentId'));
    var linkKey = get(this, '_linkKey');

    for (var i = index; i < index + removed; i++) {
      var record = get(this, 'content').objectAt(i);
      context.unlink(owner, linkKey, record);
    }

    return this._super.apply(this, arguments);
  },

  arrayContentDidChange: function(index, removed, added) {
    this._super.apply(this, arguments);

    var context = get(this, 'context');
    var owner = context.retrieve(get(this, '_parentType'), get(this, '_parentId'));
    var linkKey = get(this, '_linkKey');

    for (var i = index; i < index + added; i++) {
      var record = get(this, 'content').objectAt(i);
      context.link(owner, linkKey, record);
    }
  }

});

export default HasManyArray;
