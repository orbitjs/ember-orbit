import RecordArray from "./record_array";
import LinkProxyMixin from './../link_proxy_mixin';

/**
 @module ember-orbit
*/

/**
 A `ManyArray` is a `RecordArray` that represents the contents of a has-many
 relationship.

 @class ManyArray
 @namespace EO
 @extends EO.RecordArray
*/
var ManyArray = RecordArray.extend(LinkProxyMixin);

export default ManyArray;
