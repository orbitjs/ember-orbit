import { dummyModels } from 'dummy/tests/support/dummy-models';
import { createStore } from 'dummy/tests/support/store';
import Orbit from 'orbit';
import Schema from 'ember-orbit/schema';

const { Planet, Moon, Star } = dummyModels;

const set = Ember.set;

module("Integration - Schema", function(hooks) {
  let store;
  let schema;

  hooks.beforeEach(function() {
    Orbit.Promise = Ember.RSVP.Promise;

    const models = { planet: Planet, moon: Moon, star: Star };
    store = createStore({ models });
    schema = store.get('schema');
  });

  hooks.afterEach(function() {
    schema = null;
  });

  test("it exists", function() {
    ok(schema);
  });

  test("#defineModel defines models on the underlying Orbit schema", function() {
    schema.modelFor('planet');

    deepEqual(schema.models(), ['planet', 'star', 'moon']);

    deepEqual(schema.attributes('star'), ['name', 'isStable']);
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
      inverse: "moons",
      type:  "hasOne",
      model: "planet"
    });

    deepEqual(schema.attributes('planet'), ['name', 'atmosphere', 'classification']);
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
      inverse: "planet",
      type:  "hasMany",
      model: "moon"
    });
  });

  test("#modelFor returns the appropriate model when passed a model's name", function() {
    equal(schema.modelFor('planet'), Planet);
  });

  test("#modelFor ensures that related models are also registered in the schema", function() {
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

  test('#normalize', function(assert) {
    const done = assert.async();

    Ember.RSVP.Promise.all([
      store.addRecord({type: 'moon', id: 'callisto', name: 'Callisto'}),
      store.addRecord({type: 'star', id: 'sun', name: 'The Sun'}),
    ])
    .then(([callisto, sun]) => {
      const normalized = schema.normalize({
        type: 'planet',
        id: 'jupiter',
        name: 'Jupiter',
        moons: [callisto],
        sun: sun
      });

      assert.equal(normalized.id, 'jupiter', 'normalized id');
      assert.equal(normalized.type, 'planet', 'normalized type');
      assert.deepEqual(normalized.keys, { galaxyAlias: undefined, id: 'jupiter' }, 'normalized keys');
      assert.deepEqual(normalized.attributes, { atmosphere: false, classification: undefined, name: 'Jupiter' });
      assert.deepEqual(normalized.relationships.moons, { data: { 'moon:callisto': true } }, 'normalized hasMany');
      assert.deepEqual(normalized.relationships.sun, { data: 'star:sun' }, 'normalized hasOne');

      done();
    });
  });

  test('#normalize - undefined relationships', function(assert) {
    const normalized = schema.normalize({
      type: 'planet',
      id: 'jupiter',
      name: 'Jupiter'
    });

    assert.deepEqual(normalized.relationships.moons, { data: {} }, 'normalized hasMany');
    assert.deepEqual(normalized.relationships.sun, { data: null }, 'normalized hasOne');
  });
});
