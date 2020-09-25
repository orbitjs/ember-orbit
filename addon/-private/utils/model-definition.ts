import {
  KeyDefinition,
  AttributeDefinition,
  RelationshipDefinition,
  ModelDefinition
} from '@orbit/data';

import Model from '../model';

const MODEL_DEFINITIONS = Symbol('@orbit:modelDefinitions');
const PROPERTY_NOTIFIERS = Symbol('@orbit:poropertyNotifiers');

export type Notifier = (record: Model) => void;

export function getModelDefinition(proto: object): ModelDefinition {
  if (proto[MODEL_DEFINITIONS]) {
    return proto[MODEL_DEFINITIONS] as ModelDefinition;
  } else {
    proto[MODEL_DEFINITIONS] = {};
    return proto[MODEL_DEFINITIONS];
  }
}

export function getPropertyNotifiers(proto: object): Record<string, Notifier> {
  proto[PROPERTY_NOTIFIERS] = (proto[PROPERTY_NOTIFIERS] || {}) as Record<
    string,
    Notifier
  >;
  return proto[PROPERTY_NOTIFIERS];
}

export function defineAttribute(
  proto: object,
  name: string,
  options: AttributeDefinition,
  notifier: Notifier
): void {
  const modelDefinition = getModelDefinition(proto);
  modelDefinition.attributes = modelDefinition.attributes || {};
  modelDefinition.attributes[name] = options;
  getPropertyNotifiers(proto)[name] = notifier;
}

export function defineKey(
  proto: object,
  name: string,
  options: KeyDefinition,
  notifier: Notifier
): void {
  const modelDefinition = getModelDefinition(proto);
  modelDefinition.keys = modelDefinition.keys || {};
  modelDefinition.keys[name] = options;
  getPropertyNotifiers(proto)[name] = notifier;
}

export function defineRelationship(
  proto: object,
  name: string,
  options: RelationshipDefinition,
  notifier: Notifier
): void {
  const modelDefinition = getModelDefinition(proto);
  modelDefinition.relationships = modelDefinition.relationships || {};
  modelDefinition.relationships[name] = options;
  getPropertyNotifiers(proto)[name] = notifier;
}
