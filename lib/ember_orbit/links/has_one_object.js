import LinkProxyMixin from './link_proxy_mixin';

/**
 @module ember-orbit
*/

/**
 A `HasOneObject` is an `ObjectProxy` that represents the contents of a has-one
 relationship.

 @class HasOneObject
 @namespace EO
 @extends Ember.ObjectProxy
*/
var HasOneObject = Ember.ObjectProxy.extend(LinkProxyMixin);

export default HasOneObject;
