import Schema from './schema';
import OCSource from 'orbit_common/source';

var get = Ember.get,
    set = Ember.set;

var Source = Ember.Object.extend({
  orbitSourceClass: null,
  orbitSourceOptions: null,
  schema: null,

  /**
   @method init
   @private
   */
  init: function() {
    this._super.apply(this, arguments);

    var OrbitSourceClass = get(this, 'orbitSourceClass');
    Ember.assert("Source.orbitSourceClass must be initialized with an instance of an `OC.Source`",
      OrbitSourceClass);

    var schema = get(this, 'schema');
    if (!schema) {
      var container = get(this, 'container');
      schema = container.lookup('schema:main');
      set(this, 'schema', schema);
    }

    var orbitSourceSchema = get(schema, '_schema');
    var orbitSourceOptions = get(this, 'orbitSourceOptions');
    this._source = new OrbitSourceClass(orbitSourceSchema, orbitSourceOptions);
  }
});

export default Source;