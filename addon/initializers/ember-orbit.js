import Ember from 'ember';
import Orbit from '@orbit/data';
import Store from '../-private/store';
import SchemaFactory from '../-private/factories/schema-factory';
import CoordinatorFactory from '../-private/factories/coordinator-factory';
import KeyMapFactory from '../-private/factories/key-map-factory';

export function initialize(application) {
  Orbit.Promise = Ember.RSVP.Promise;

  // Services
  application.register('service:data-schema', SchemaFactory);
  application.register('service:data-coordinator', CoordinatorFactory);
  application.register('service:data-key-map', KeyMapFactory);
  application.register('service:store', Store);

  // Injections to store
  application.inject('service:store', 'schema', 'service:data-schema');
  application.inject('service:store', 'coordinator', 'service:data-coordinator');
  application.inject('service:store', 'keyMap', 'service:data-key-map');

  // Injections to application elements
  application.inject('route', 'store', 'service:store');
  application.inject('controller', 'store', 'service:store');
}

export default {
  name: 'ember-orbit',
  initialize
};
