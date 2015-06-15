import Orbit from 'orbit';
import Source from 'ember-orbit/source';
import Schema from 'ember-orbit/schema';
import OCMemorySource from 'orbit-common/memory-source';
import OCLocalStorageSource from 'orbit-common/local-storage-source';

var source;

module("Unit - Source", {
  setup: function() {
    Orbit.Promise = Ember.RSVP.Promise;

    source = Source.create({
      schema: Schema.create(),
      orbitSourceClass: OCMemorySource
    });
  },
  teardown: function() {
    source = null;
  }
});

test("it exists", function() {
  ok(source);
});

test("it can specify a custom `orbitSourceClass` and `orbitSourceOptions`", function() {
  expect(3);

  var CustomSource = Source.extend({
    orbitSourceClass: OCLocalStorageSource,
    orbitSourceOptions: {
      namespace: 'custom'
    }
  });

  var customSource = CustomSource.create({
    container: new Ember.Registry().container(),
    schema: Schema.create()
  });

  ok(customSource, 'custom source exists');
  ok(customSource.orbitSource instanceof OCLocalStorageSource, 'custom source has the right type of `orbitSource`');
  equal(customSource.orbitSource.namespace, 'custom', 'custom source has the right custom namespace');
});
