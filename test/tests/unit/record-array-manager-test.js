import Orbit from 'orbit';
import RecordArrayManager from 'ember-orbit/record-array-manager';

var get = Ember.get;

var jupiter,
    recordArrayManager;

module('Unit - RecordArrayManager', {
  setup: function() {
    jupiter = {name: 'Jupiter', destroy: sinon.spy()};
    recordArrayManager = RecordArrayManager.create({});
  },

  teardown: function() {
    jupiter = null;
    recordArrayManager = null;
  }
});

test('#willDestroy destroys objects in filterRecordArrays', function() {
  recordArrayManager.filteredRecordArrays.get('planet').push(jupiter);
  recordArrayManager.willDestroy();
  ok(jupiter.destroy.called);
});

test('#willDestroy with no filterRecordArrays values, completes w/o error', function() {
  try {
    recordArrayManager.willDestroy();
    ok('passed');
  } catch(exception) {
    ok(false, 'willDestroy throws: ' + exception);
  }
});
