import key from 'ember-orbit/fields/key';
import attr from 'ember-orbit/fields/attr';
import hasOne from 'ember-orbit/fields/has-one';
import hasMany from 'ember-orbit/fields/has-many';
import Model from 'ember-orbit/model';
import { module, test } from 'qunit';

const { get } = Ember;

module("Unit - Model", function(hooks) {
  let Planet,
      Moon,
      Star;

  hooks.beforeEach(function() {
    Planet = Model.extend({
      name: attr('string'),
      classification: attr('string'),
      sun: hasOne('star'),
      moons: hasMany('moon')
    });

    Moon = Model.extend({
      name: attr('string'),
      planet: hasOne('planet')
    });

    Star = Model.extend({
      name: attr('string'),
      planets: hasMany('planet')
    });
  });

  hooks.afterEach(function() {
    Planet = null;
    Moon = null;
    Star = null;
  });

  test("it exists", function(assert) {
    assert.ok(Planet);
  });

  test("#keys returns no keys by default", function(assert) {
    var keys,
        names;

    keys = get(Planet, 'keys');
    names = Object.keys(keys);
    assert.equal(names.length, 0);
  });

  test("#keys returns defined custom secondary keys", function(assert) {
    var keys,
        names;

    Planet.reopen({
      remoteId: key()
    });

    keys = get(Planet, 'keys');
    names = Object.keys(keys);
    assert.equal(names.length, 1);
    assert.equal(names[0], 'remoteId');
  });

  test("#attributes returns defined attributes", function(assert) {
    var attributes,
        keys;

    attributes = get(Planet, 'attributes');
    keys = Object.keys(attributes);
    assert.equal(keys.length, 2);
    assert.equal(keys[0], 'name');
    assert.equal(keys[1], 'classification');
  });

  test("#relationships returns defined relationships", function(assert) {
    var relationships,
        keys;

    relationships = get(Planet, 'relationships');
    keys = Object.keys(relationships);
    assert.equal(keys.length, 2);
    assert.equal(keys[0], 'sun');
    assert.equal(keys[1], 'moons');

    relationships = get(Moon, 'relationships');
    keys = Object.keys(relationships);
    assert.equal(keys.length, 1);
    assert.equal(keys[0], 'planet');

    relationships = get(Star, 'relationships');
    keys = Object.keys(relationships);
    assert.equal(keys.length, 1);
    assert.equal(keys[0], 'planets');
  });

  test("#create cannot be called directly on models", function(assert) {
    assert.throws(
      function() {
        Planet.create();
      },
      'You should not call `create` on a model'
    );
  });
});
