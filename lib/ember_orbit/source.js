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

    var schema = get(this, 'schema');
    if (!schema) {
      var container = get(this, 'container');
      schema = container.lookup('schema:main');
      set(this, 'schema', schema);
    }

    if(!this.orbitSource){
      this.orbitSource = this._buildOrbitSource(schema);
    }
  },

  _buildOrbitSource: function(schema){
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
      OrbitSourceClass instanceof OCSource);

    var orbitSourceSchema = get(schema, '_schema');
    var orbitSourceOptions = get(this, 'orbitSourceOptions');

    return new OrbitSourceClass(orbitSourceSchema, orbitSourceOptions); 
  }
});

export default Source;