import Ember from 'ember';
import Orbit from '@orbit/data';
import Store from '../store';
import Schema from '../schema';
import KeyMap from '../key-map';
import Coordinator from '../coordinator';

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
