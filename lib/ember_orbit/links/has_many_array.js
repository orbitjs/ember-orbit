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
var HasManyArray = RecordArray.extend(LinkProxyMixin);

export default HasManyArray;
