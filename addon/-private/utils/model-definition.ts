import {
  KeyDefinition,
  AttributeDefinition,
  RelationshipDefinition,
  ModelDefinition
} from '@orbit/records';
import { clone, deepMerge } from '@orbit/utils';

const MODEL_DEFINITION = Symbol('@orbit:modelDefinition');
const MODEL_DEFINITION_FOR = Symbol('@orbit:modelDefinitionFor');

export function getModelDefinition(proto: object): ModelDefinition {
  if (proto[MODEL_DEFINITION]) {
    return proto[MODEL_DEFINITION] as ModelDefinition;
  } else {
    proto[MODEL_DEFINITION] = {};
    return proto[MODEL_DEFINITION];
  }
}

export function extendModelDefinition(
  proto: object,
  modelDefinition: ModelDefinition
): void {
  if (proto[MODEL_DEFINITION] && proto[MODEL_DEFINITION_FOR]) {
    let currentDef = proto[MODEL_DEFINITION];
    if (proto[MODEL_DEFINITION_FOR] !== proto) {
      currentDef = clone(currentDef);
      proto[MODEL_DEFINITION_FOR] = proto;
    }
    proto[MODEL_DEFINITION] = deepMerge(currentDef, modelDefinition);
  } else {
    proto[MODEL_DEFINITION] = modelDefinition;
    proto[MODEL_DEFINITION_FOR] = proto;
  }
}

export function defineAttribute(
  proto: object,
  name: string,
  options: AttributeDefinition
): void {
  extendModelDefinition(proto, {
    attributes: { [name]: options }
  });
}

export function defineKey(
  proto: object,
  name: string,
  options: KeyDefinition
): void {
  extendModelDefinition(proto, {
    keys: { [name]: options }
  });
}

export function defineRelationship(
  proto: object,
  name: string,
  options: RelationshipDefinition
): void {
  extendModelDefinition(proto, {
    relationships: { [name]: options }
  });
}
