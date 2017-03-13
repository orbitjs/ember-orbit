import { KeyMap as OrbitKeyMap } from '@orbit/data';
import KeyMap from 'ember-orbit/key-map';
import { module, test } from 'qunit';

module('Unit - KeyMap', function() {
  test('can be instantiated', function(assert) {
    const keyMap = KeyMap.create();

    assert.ok(keyMap, 'keyMap has been created');
  });

  test('can be instantiated from an existing Orbit KeyMap', function(assert) {
    const orbitKeyMap = new OrbitKeyMap();

    const keyMap = KeyMap.create({
      orbitKeyMap
    });

    assert.ok(keyMap, 'keyMap has been created');
  });
});
