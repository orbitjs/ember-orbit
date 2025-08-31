import { Orbit } from '@orbit/core';
import type { OrbitConfig } from './ember-orbit-config.ts';
import SchemaFactory from '../-private/factories/schema-factory.ts';
import CoordinatorFactory from '../-private/factories/coordinator-factory.ts';
import KeyMapFactory from '../-private/factories/key-map-factory.ts';
import NormalizerFactory from '../-private/factories/normalizer-factory.ts';
import MemorySourceFactory from '../-private/factories/memory-source-factory.ts';
import StoreFactory from '../-private/factories/store-factory.ts';
import ValidatorFactory from '../-private/factories/validator-factory.ts';
import type ApplicationInstance from '@ember/application/instance';

const { deprecate } = Orbit;

export function initialize(application: ApplicationInstance) {
  const orbitConfig: OrbitConfig = application.resolveRegistration(
    'ember-orbit:config',
  ) as OrbitConfig;

  if (!orbitConfig.skipKeyMapService) {
    // Register a keyMap service
    application.register(
      `service:${orbitConfig.services.keyMap}`,
      KeyMapFactory,
    );
  }

  if (!orbitConfig.skipSchemaService) {
    // Register a schema service
    application.register(
      `service:${orbitConfig.services.schema}`,
      SchemaFactory,
    );
  }

  if (!orbitConfig.skipValidatorService) {
    // Register a validator service
    application.register(
      `service:${orbitConfig.services.validator}`,
      ValidatorFactory,
    );
  }

  if (!orbitConfig.skipNormalizerService) {
    // Register a normalizer service
    application.register(
      `service:${orbitConfig.services.normalizer}`,
      NormalizerFactory,
    );
  }

  if (!orbitConfig.skipCoordinatorService) {
    // Register a coordinator service
    application.register(
      `service:${orbitConfig.services.coordinator}`,
      CoordinatorFactory,
    );
  }

  if (!orbitConfig.skipStoreService) {
    application.register(
      `${orbitConfig.types.source}:store`,
      MemorySourceFactory,
    );
    application.register(`service:${orbitConfig.services.store}`, StoreFactory);

    // @ts-expect-error TODO: fix this type error
    if (orbitConfig.skipStoreInjections !== undefined) {
      deprecate(
        'The `skipStoreInjections` configuration option in ember-orbit is deprecated because implicit injection is now deprecated in Ember itself. Please inject the orbit store into routes and controllers using the `@service` decorator as needed.',
      );
    }
  }
}

export default {
  name: 'ember-orbit-services',
  after: 'ember-orbit-config',
  initialize,
};
