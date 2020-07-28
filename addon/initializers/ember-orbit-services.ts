import Application from '@ember/application';
import { camelize } from '@ember/string';

import { OrbitConfig } from './ember-orbit-config';
import Store from '../-private/store';
import SchemaFactory from '../-private/factories/schema-factory';
import CoordinatorFactory from '../-private/factories/coordinator-factory';
import KeyMapFactory from '../-private/factories/key-map-factory';
import MemorySourceFactory from '../-private/factories/memory-source-factory';

export function initialize(application: Application) {
  let orbitConfig: OrbitConfig =
    application.resolveRegistration('ember-orbit:config') || {};

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

    application.register(
      'ember-orbit:configMutableModels',
      orbitConfig.mutableModels,
      { instantiate: false }
    );
    application.register(
      'ember-orbit:configCreateModelsFromSchema',
      orbitConfig.createModelsFromSchema,
      { instantiate: false }
    );

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
