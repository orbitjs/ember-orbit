import { Promise as EmberPromise } from 'rsvp';
import Orbit from '@orbit/data';
import Store from '../-private/store';
import SchemaFactory from '../-private/factories/schema-factory';
import CoordinatorFactory from '../-private/factories/coordinator-factory';
import KeyMapFactory from '../-private/factories/key-map-factory';
import StoreFactory from '../-private/factories/store-factory';

export function initialize(application) {
  Orbit.Promise = EmberPromise;

  // Customize pluralization rules
  if (application.__registry__ &&
      application.__registry__.resolver &&
      application.__registry__.resolver.pluralizedTypes) {
    application.__registry__.resolver.pluralizedTypes['data-strategy'] = 'data-strategies';
  }

  // Schema and keymap
  application.register('data-schema:main', SchemaFactory);
  application.register('data-key-map:main', KeyMapFactory);

  // Services
  application.register('service:data-coordinator', CoordinatorFactory);
  application.register('service:store', Store);

  // Store source (which is injected in store service)
  application.register('data-source:store', StoreFactory);
  application.inject('service:store', 'source', 'data-source:store');

  // Injections to all sources
  application.inject('data-source', 'schema', 'data-schema:main');
  application.inject('data-source', 'keyMap', 'data-key-map:main');

  // Injections to application elements
  application.inject('route', 'store', 'service:store');
  application.inject('controller', 'store', 'service:store');
}

export default {
  name: 'ember-orbit',
  initialize
};
