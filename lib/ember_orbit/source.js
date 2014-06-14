import Schema from './schema';
import OCSource from 'orbit_common/source';

var get = Ember.get,
    set = Ember.set;

var Source = Ember.Object.extend({
  SourceClass: null,
  schema: null,

  /**
   @method init
   @private
   */
  init: function() {
    this._super.apply(this, arguments);

    var SourceClass = get(this, 'SourceClass');
    Ember.assert("Source.SourceClass must be initialized with an instance of an `OC.Source`",
      SourceClass);

    var schema = get(this, 'schema');
    Ember.assert("A Source must be initialized with a `schema` property",
      schema);

    this._source = new SourceClass(get(schema, '_schema'));
  }

});

export default Source;