import Store from '../-private/store';
import SchemaFactory from '../-private/factories/schema-factory';
import CoordinatorFactory from '../-private/factories/coordinator-factory';
import KeyMapFactory from '../-private/factories/key-map-factory';
import MemorySourceFactory from '../-private/factories/memory-source-factory';
import { camelize } from '@ember/string';

export function initialize(application) {
  let orbitConfig = application.resolveRegistration('ember-orbit:config') || {};

  if (!orbitConfig.skipKeyMapService) {
    // Register a keyMap service
    application.register(
      `service:${orbitConfig.services.keyMap}`,
      KeyMapFactory
    );

    // Inject keyMap into all sources
    application.inject(
      orbitConfig.types.source,
      'keyMap',
      `service:${orbitConfig.services.keyMap}`
    );
  }

  if (!orbitConfig.skipSchemaService) {
    // Register a schema service
    application.register(
      `service:${orbitConfig.services.schema}`,
      SchemaFactory
    );

    // Inject schema into all sources
    application.inject(
      orbitConfig.types.source,
      'schema',
      `service:${orbitConfig.services.schema}`
    );
  }

  if (!orbitConfig.skipCoordinatorService) {
    // Register a coordinator service
    application.register(
      `service:${orbitConfig.services.coordinator}`,
      CoordinatorFactory
    );
  }

  if (!orbitConfig.skipStoreService) {
    application.register(`service:${orbitConfig.services.store}`, Store);

    // Store source (which is injected in store service)
    application.register(
      `${orbitConfig.types.source}:store`,
      MemorySourceFactory
    );
    application.inject(
      `service:${orbitConfig.services.store}`,
      'source',
      `${orbitConfig.types.source}:store`
    );

    if (!orbitConfig.skipStoreInjections) {
      // Inject store to all routes and controllers
      application.inject(
        'route',
        camelize(orbitConfig.services.store),
        `service:${orbitConfig.services.store}`
      );
      application.inject(
        'controller',
        camelize(orbitConfig.services.store),
        `service:${orbitConfig.services.store}`
      );
    }
  }
}

export default {
  name: 'ember-orbit-services',
  after: 'ember-orbit-config',
  initialize
};
