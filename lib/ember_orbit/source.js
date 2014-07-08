import Schema from './schema';
import OCSource from 'orbit_common/source';

/**
 @module ember-orbit
 */

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
    // If `orbitSourceClass` is obtained through the _super chain, dereference
    // its wrapped function, which will be the constructor.
    //
    // Note: This is only necessary when retrieving a *constructor* from an Ember
    //       class hierarchy. Otherwise, `superWrapper` "just works".
    if (OrbitSourceClass && OrbitSourceClass.wrappedFunction) {
     OrbitSourceClass = OrbitSourceClass.wrappedFunction;
    }

    Ember.assert("Source.orbitSourceClass must be initialized with an instance of an `OC.Source`",
      OrbitSourceClass); // TODO: verify OrbitSourceClass instanceof OCSource - need to resolve an inheritance problem in Orbit first

    var schema = get(this, 'schema');
    if (!schema) {
      var container = get(this, 'container');
      schema = container.lookup('schema:main');
      set(this, 'schema', schema);
    }

    var orbitSourceSchema = get(schema, '_schema');
    var orbitSourceOptions = get(this, 'orbitSourceOptions');
    this.orbitSource = new OrbitSourceClass(orbitSourceSchema, orbitSourceOptions);
  }
});

export default Source;