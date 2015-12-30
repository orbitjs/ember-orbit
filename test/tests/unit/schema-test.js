import 'tests/test-helper';
import Orbit from 'orbit';
import OrbitSchema from 'orbit-common/schema';
import Schema from 'ember-orbit/schema';
import attr from 'ember-orbit/fields/attr';
import hasOne from 'ember-orbit/fields/has-one';
import hasMany from 'ember-orbit/fields/has-many';
import Model from 'ember-orbit/model';

const set = Ember.set;

let schema;

module("Integration - Schema", function(hooks) {
  hooks.beforeEach(function() {
    Orbit.Promise = Ember.RSVP.Promise;
    const orbitSchema = new OrbitSchema();

    schema = Schema.create({_orbitSchema: orbitSchema});
  });

  hooks.afterEach(function() {
    schema = null;
  });

  test("it exists", function() {
    ok(schema);
  });

  test("#defineModel defines models on the underlying Orbit schema", function() {
    let Star;
    let Moon;
    let Planet;

    Star = Model.extend({
      name: attr('string'),
      planets: hasMany('planet')
    });

    Moon = Model.extend({
      name: attr('string'),
      planet: hasOne('planet')
    });

    Planet = Model.extend({
      name: attr('string'),
      classification: attr('string'),
      sun: hasOne('star'),
      moons: hasMany('moon')
    });

    schema.defineModel('star', Star);
    schema.defineModel('moon', Moon);
    schema.defineModel('planet', Planet);

    deepEqual(schema.models(), ['star', 'moon', 'planet']);

    deepEqual(schema.attributes('star'), ['name']);
    deepEqual(schema.relationships('star'), ['planets']);
    deepEqual(schema.attributeProperties('star', 'name'), {
      type: "string"
    });
    deepEqual(schema.relationshipProperties('star', 'planets'), {
      type:  "hasMany",
      model: "planet"
    });

    deepEqual(schema.attributes('moon'), ['name']);
    deepEqual(schema.relationships('moon'), ['planet']);
    deepEqual(schema.attributeProperties('moon', 'name'), {
      type: "string"
    });
    deepEqual(schema.relationshipProperties('moon', 'planet'), {
      type:  "hasOne",
      model: "planet"
    });

    deepEqual(schema.attributes('planet'), ['name', 'classification']);
    deepEqual(schema.relationships('planet'), ['sun', 'moons']);
    deepEqual(schema.attributeProperties('planet', 'name'), {
      type: "string"
    });
    deepEqual(schema.attributeProperties('planet', 'classification'), {
      type: "string"
    });
    deepEqual(schema.relationshipProperties('planet', 'sun'), {
      type:  "hasOne",
      model: "star"
    });
    deepEqual(schema.relationshipProperties('planet', 'moons'), {
      type:  "hasMany",
      model: "moon"
    });
  });

  test("#modelFor returns the appropriate model when passed a model's name", function() {
    const Planet = Model.extend();

    const registry = new Ember.Registry();
    const container = registry.container();
    registry.register('schema:main', Schema);
    registry.register('model:planet', Planet);

    set(schema, 'container', container);

    equal(schema.modelFor('planet'), Planet);
  });

  test("#modelFor ensures that related models are also registered in the schema", function() {
    let Star;
    let Moon;
    let Planet;

    Star = Model.extend({
      name: attr('string'),
      planets: hasMany('planet')
    });

    Moon = Model.extend({
      name: attr('string'),
      planet: hasOne('planet')
    });

    Planet = Model.extend({
      name: attr('string'),
      classification: attr('string'),
      sun: hasOne('star'),
      moons: hasMany('moon')
    });

    const registry = new Ember.Registry();
    const container = registry.container();
    registry.register('schema:main', Schema);
    registry.register('model:planet', Planet);
    registry.register('model:star', Star);
    registry.register('model:moon', Moon);

    set(schema, 'container', container);

    deepEqual(schema.models(), [], 'no models have been registered');

    schema.modelFor('planet');

    deepEqual(schema.models(), ['planet', 'star', 'moon'], 'all related models have been registered');
  });
});
