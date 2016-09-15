import OrbitKeyMap from 'orbit/key-map';
import KeyMap from 'ember-orbit/key-map';

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
