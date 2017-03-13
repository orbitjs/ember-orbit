import { dummyModels } from 'dummy/tests/support/dummy-models';
import { createStore } from 'dummy/tests/support/store';
import Orbit from '@orbit/data';
import { module, test } from 'qunit';

const { Planet, Moon, Star } = dummyModels;

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

  test("it exists", function(assert) {
    assert.ok(schema);
  });

  test("#types - specifies models that are defined on the underlying Orbit schema", function(assert) {
    schema.modelFor('planet');

    assert.deepEqual(schema.get('types'), ['planet', 'moon', 'star']);

    assert.deepEqual(schema.attributes('star'), ['name', 'isStable']);
    assert.deepEqual(schema.relationships('star'), ['planets']);
    assert.deepEqual(schema.attributeProperties('star', 'name'), {
      type: "string"
    });
    assert.deepEqual(schema.relationshipProperties('star', 'planets'), {
      type:  "hasMany",
      model: "planet"
    });

    assert.deepEqual(schema.attributes('moon'), ['name']);
    assert.deepEqual(schema.relationships('moon'), ['planet']);
    assert.deepEqual(schema.attributeProperties('moon', 'name'), {
      type: "string"
    });
    assert.deepEqual(schema.relationshipProperties('moon', 'planet'), {
      inverse: "moons",
      type:  "hasOne",
      model: "planet"
    });

    assert.deepEqual(schema.attributes('planet'), ['name', 'atmosphere', 'classification']);
    assert.deepEqual(schema.relationships('planet'), ['sun', 'moons']);
    assert.deepEqual(schema.attributeProperties('planet', 'name'), {
      type: "string"
    });
    assert.deepEqual(schema.attributeProperties('planet', 'classification'), {
      type: "string"
    });
    assert.deepEqual(schema.relationshipProperties('planet', 'sun'), {
      type:  "hasOne",
      model: "star"
    });
    assert.deepEqual(schema.relationshipProperties('planet', 'moons'), {
      inverse: "planet",
      type:  "hasMany",
      model: "moon"
    });
  });

  test("#modelFor returns the appropriate model when passed a model's name", function(assert) {
    assert.strictEqual(schema.modelFor('planet'), Planet);
  });

  test('#normalize', function(assert) {
    const done = assert.async();

    Ember.RSVP.Promise.all([
      store.addRecord({type: 'moon', id: 'callisto', name: 'Callisto'}),
      store.addRecord({type: 'star', id: 'sun', name: 'The Sun'})
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
      assert.deepEqual(normalized.keys, undefined, 'normalized keys');
      assert.deepEqual(normalized.attributes, { name: 'Jupiter' });
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

    assert.strictEqual(normalized.relationships, undefined, 'normalized hasMany');
  });
});
