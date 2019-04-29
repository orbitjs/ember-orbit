import { Promise as EmberPromise } from 'rsvp';
import Orbit from '@orbit/data';
import Store from '../-private/store';
import SchemaFactory from '../-private/factories/schema-factory';
import CoordinatorFactory from '../-private/factories/coordinator-factory';
import KeyMapFactory from '../-private/factories/key-map-factory';
import StoreFactory from '../-private/factories/store-factory';
import { camelize } from '@ember/string';

export const DEFAULT_ORBIT_CONFIG = {
  types: {
    model: 'data-model',
    source: 'data-source',
    strategy: 'data-strategy'
  },
  collections: {
    models: 'data-models',
    sources: 'data-sources',
    strategies: 'data-strategies'
  },
  services: {
    store: 'store',
    coordinator: 'data-coordinator',
    schema: 'data-schema',
    keyMap: 'data-key-map'
  }
};

export function initialize(application) {
  Orbit.Promise = EmberPromise;

  let orbitConfig = {};
  let config = application.resolveRegistration('config:environment') || {};
  config.orbit = config.orbit || {};
  ['types', 'collections', 'services'].forEach((key) => {
    orbitConfig[key] = Object.assign({}, DEFAULT_ORBIT_CONFIG[key], config.orbit[key]);
  });

  // Customize pluralization rules
  if (application.__registry__ &&
      application.__registry__.resolver &&
      application.__registry__.resolver.pluralizedTypes) {
    application.__registry__.resolver.pluralizedTypes[orbitConfig.types.model] = orbitConfig.collections.models;
    application.__registry__.resolver.pluralizedTypes[orbitConfig.types.source] = orbitConfig.collections.sources;
    application.__registry__.resolver.pluralizedTypes[orbitConfig.types.strategy] = orbitConfig.collections.strategies;
  }

  application.register('ember-orbit:config', orbitConfig, { instantiate: false });

  // Services
  application.register(`service:${orbitConfig.services.schema}`, SchemaFactory);
  application.register(`service:${orbitConfig.services.keyMap}`, KeyMapFactory);
  application.register(`service:${orbitConfig.services.coordinator}`, CoordinatorFactory);
  application.register(`service:${orbitConfig.services.store}`, Store);

  // Store source (which is injected in store service)
  application.register(`${orbitConfig.types.source}:store`, StoreFactory);
  application.inject(`service:${orbitConfig.services.store}`, 'source', `${orbitConfig.types.source}:store`);

  // Injections to all sources
  application.inject(orbitConfig.types.source, 'schema', `service:${orbitConfig.services.schema}`);
  application.inject(orbitConfig.types.source, 'keyMap', `service:${orbitConfig.services.keyMap}`);

  // Injections to application elements
  application.inject('route', camelize(orbitConfig.services.store), `service:${orbitConfig.services.store}`);
  application.inject('controller', camelize(orbitConfig.services.store), `service:${orbitConfig.services.store}`);
}

export default {
  name: 'ember-orbit',
  initialize
};
