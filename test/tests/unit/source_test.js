import Orbit from 'orbit';
import Source from 'ember_orbit/source';
import Schema from 'ember_orbit/schema';
import OCMemorySource from 'orbit_common/memory_source';

var source;

module("Unit - Source", {
  setup: function() {
    Orbit.Promise = Ember.RSVP.Promise;
    
    source = Source.create({
      schema: Schema.create(),
      SourceClass: OCMemorySource
    });
  },
  teardown: function() {
    source = null;
  }
});

test("it exists", function() {
  ok(source);
});
