import Ember from 'ember';
import Orbit from 'orbit';
import Store from 'ember-orbit/store';
import Schema from 'ember-orbit/schema';
import KeyMap from 'ember-orbit/key-map';
import Coordinator from 'ember-orbit/coordinator';

export function initialize(application) {
  Orbit.Promise = Ember.RSVP.Promise;

  application.register('data-key-map:main', KeyMap);
  application.register('data-schema:main', Schema);
  application.register('data-coordinator:main', Coordinator);
  application.register('service:store', Store);
  application.inject('service:store', 'schema', 'data-schema:main');
  application.inject('service:store', 'keyMap', 'data-key-map:main');
  application.inject('service:store', 'coordinator', 'data-coordinator:main');
  application.inject('data-source', 'schema', 'data-schema:main');
  application.inject('data-source', 'keyMap', 'data-key-map:main');
  application.inject('data-source', 'coordinator', 'data-coordinator:main');
  application.inject('route', 'store', 'service:store');
  application.inject('controller', 'store', 'service:store');
}

export default {
  name: 'ember-orbit',
  initialize
};
