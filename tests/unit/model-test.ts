import { key, attr, hasOne, hasMany, Model } from 'ember-orbit';
import { module, test } from 'qunit';

module('Unit - Model', function () {
  module('fields defined by `type`, `definition` object', function () {
    class Planet extends Model {
      @attr('string') name?: string;
      @attr('string') classification?: string;
      @hasOne('star') sun!: Star | null;
      @hasMany('moon', { inverse: 'planet' }) moons!: Moon[];
    }

    class Moon extends Model {
      @attr('string') name?: string;
      @hasOne('planet', { inverse: 'moons' }) planet!: Planet | null;
    }

    class Star extends Model {
      @attr('string') name?: string;
      @hasMany('planet') planets!: Planet[];
    }

    class SolarSystem extends Model {
      @hasMany(['star', 'planet', 'moon']) bodies!: (Star | Planet | Moon)[];
    }

    test('it exists', function (assert) {
      assert.ok(Planet);
    });

    test('#keys returns no keys by default', function (assert) {
      var keys, names;

      keys = Planet.keys;
      names = Object.keys(keys);
      assert.strictEqual(names.length, 0);
    });

    test('#keys returns defined custom secondary keys', function (assert) {
      var keys, names;

      class Planet2 extends Planet {
        @key() remoteId?: string;
      }

      keys = Planet2.keys;
      names = Object.keys(keys);
      assert.strictEqual(names.length, 1);
      assert.strictEqual(names[0], 'remoteId');

      assert.deepEqual(Planet2.definition.keys?.remoteId, {});
    });

    test('#attributes returns defined attributes', function (assert) {
      var attributes, keys;

      attributes = Planet.attributes;
      keys = Object.keys(attributes);
      assert.strictEqual(keys.length, 2);
      assert.strictEqual(keys[0], 'name');
      assert.strictEqual(keys[1], 'classification');

      assert.deepEqual(Planet.definition.attributes, {
        name: { type: 'string' },
        classification: { type: 'string' }
      });
    });

    test('#relationships returns defined relationships', function (assert) {
      var relationships, keys;

      relationships = Planet.relationships;
      keys = Object.keys(relationships);
      assert.strictEqual(keys.length, 2);
      assert.strictEqual(keys[0], 'sun');
      assert.strictEqual(keys[1], 'moons');

      relationships = Moon.relationships;
      keys = Object.keys(relationships);
      assert.strictEqual(keys.length, 1);
      assert.strictEqual(keys[0], 'planet');

      relationships = Star.relationships;
      keys = Object.keys(relationships);
      assert.strictEqual(keys.length, 1);
      assert.strictEqual(keys[0], 'planets');

      relationships = SolarSystem.relationships;
      keys = Object.keys(relationships);
      assert.strictEqual(keys.length, 1);
      assert.deepEqual(keys[0], 'bodies');
    });

    test('#definition returns a full model definition', function (assert) {
      assert.deepEqual(Planet.definition, {
        attributes: {
          name: { type: 'string' },
          classification: { type: 'string' }
        },
        relationships: {
          sun: {
            kind: 'hasOne',
            type: 'star'
          },
          moons: {
            kind: 'hasMany',
            type: 'moon',
            inverse: 'planet'
          }
        }
      });
    });
  });

  module('fields defined by `definition` objects alone', function () {
    class Planet extends Model {
      @attr({ type: 'string' }) name?: string;
      @attr({ type: 'string' }) classification?: string;
      @hasOne({ type: 'star' }) sun!: Star | null;
      @hasMany({ type: 'moon', inverse: 'planet' }) moons!: Moon[];
    }

    class Moon extends Model {
      @attr({ type: 'string' }) name?: string;
      @hasOne({ type: 'planet', inverse: 'moons' }) planet!: Planet | null;
    }

    class Star extends Model {
      @attr({ type: 'string' }) name?: string;
      @hasMany({ type: 'planet' }) planets!: Planet[];
    }

    test('#definition returns a full model definition', function (assert) {
      assert.deepEqual(Planet.definition, {
        attributes: {
          name: { type: 'string' },
          classification: { type: 'string' }
        },
        relationships: {
          sun: {
            kind: 'hasOne',
            type: 'star'
          },
          moons: {
            kind: 'hasMany',
            type: 'moon',
            inverse: 'planet'
          }
        }
      });
    });
  });
});
