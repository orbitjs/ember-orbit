import { getOwner, setOwner } from '@ember/application';
import ApplicationInstance from '@ember/application/instance';
import { Dict } from '@orbit/utils';
import { cloneRecordIdentity, Schema } from '@orbit/data';
import MemorySource from '@orbit/memory';

import Store from './store';
import Model, { ModelSettings } from './model';

import attr from './fields/attr';
import hasMany from './fields/has-many';
import hasOne from './fields/has-one';
import { OrbitConfig } from '../initializers/ember-orbit-config';

interface Factory {
  create(settings: ModelSettings): Model;
}

function modelFactoryFor(
  modelFactoryMap: Dict<Factory>,
  store: Store,
  type: string
): Factory {
  let modelFactory = modelFactoryMap[type];

  if (!modelFactory) {
    const owner = getOwner(store) as ApplicationInstance;
    const orbitConfig = owner.lookup('ember-orbit:config') as OrbitConfig;
    const factoryName = `${orbitConfig.types.model}:${type}`;

    if (owner.hasRegistration(factoryName)) {
      modelFactory = owner.factoryFor(factoryName);
    } else if (
      orbitConfig.createModelsFromSchema &&
      store.schema.models[type]
    ) {
      modelFactory = createModelFactory(store.schema, type);
      setOwner(modelFactory, owner);
    }

    modelFactoryMap[type] = modelFactory;
  }

  return modelFactory;
}

function createModelFactory(schema: Schema, type: string) {
  const ModelFactory = class extends Model {};
  const prototype = ModelFactory.prototype;

  schema.eachAttribute(type, (property, definition) => {
    Object.defineProperty(
      prototype,
      property,
      attr(definition.type, definition)(prototype, property)
    );
  });

  schema.eachRelationship(type, (property, definition) => {
    if (definition.kind === 'hasMany') {
      Object.defineProperty(
        prototype,
        property,
        hasMany(definition.type as string | string[], definition)(
          prototype,
          property
        )
      );
    } else {
      Object.defineProperty(
        prototype,
        property,
        hasOne(definition.type as string, definition)(prototype, property)
      );
    }
  });

  return ModelFactory;
}

const modelFactoryMaps = new WeakMap<MemorySource, Dict<Factory>>();

export function modelFor(settings: ModelSettings) {
  const { store, identity } = settings;
  const source = getSource(store.source);
  const owner = getOwner(store) as ApplicationInstance;
  const orbitConfig = owner.lookup('ember-orbit:config') as OrbitConfig;

  let modelFactoryMap = modelFactoryMaps.get(source);
  if (!modelFactoryMap) {
    modelFactoryMap = {};
    modelFactoryMaps.set(source, modelFactoryMap);
  }

  return modelFactoryFor(modelFactoryMap, store, identity.type).create({
    store,
    identity: cloneRecordIdentity(identity),
    mutable: store.forked || orbitConfig.mutableModels
  });
}

function getSource(source: MemorySource) {
  if (source.base) {
    return getSource(source.base);
  }
  return source;
}
