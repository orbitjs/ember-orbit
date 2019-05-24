import { Schema, RecordRelationship, Record as OrbitRecord, ModelDefinition, RecordIdentity } from '@orbit/data';
import { deepSet } from '@orbit/utils';

export default function normalizeRecordProperties(schema: Schema, properties: Record<string, unknown>) {
  const { id, type } = properties;
  const modelDefinition = schema.getModel(type as string);
  const record = { id, type } as OrbitRecord;

  assignKeys(modelDefinition, record, properties);
  assignAttributes(modelDefinition, record, properties);
  assignRelationships(modelDefinition, record, properties);

  return record;
}

function assignKeys(modelDefinition: ModelDefinition, record: OrbitRecord, properties: Record<string, unknown>) {
  const keys = modelDefinition.keys || {};
  for (let key of Object.keys(keys)) {
    if (properties[key] !== undefined) {
      deepSet(record, ['keys', key], properties[key]);
    }
  }
}

function assignAttributes(modelDefinition: ModelDefinition, record: OrbitRecord, properties: Record<string, unknown>) {
  const attributes = modelDefinition.attributes || {};
  for (let attribute of Object.keys(attributes)) {
    if (properties[attribute] !== undefined) {
      deepSet(record, ['attributes', attribute], properties[attribute]);
    }
  }
}

function assignRelationships(modelDefinition: ModelDefinition, record: OrbitRecord, properties: Record<string, unknown>) {
  const relationships = modelDefinition.relationships || {};
  for (let relationship of Object.keys(relationships)) {
    if (properties[relationship] !== undefined) {
      let relationshipType = relationships[relationship].model as string;
      let relationshipProperties = properties[relationship] as RecordIdentity | RecordIdentity[] | string | string[] | null;
      deepSet(record, ['relationships', relationship], normalizeRelationship(relationshipType, relationshipProperties));
    }
  }
}

function normalizeRelationship(type: string, value: RecordIdentity | RecordIdentity[] | string | string[] | null): RecordRelationship {
  const relationship: RecordRelationship = {};

  if (isHasMany(value)) {
    relationship.data = [];
    for (let identity of value) {
      if (typeof identity === 'string') {
        relationship.data.push({ type, id: identity });
      } else {
        relationship.data.push({ type, id: identity.id });
      }
    }
  } else if (value === null) {
    relationship.data = null;
  } else if (typeof value === 'string') {
    relationship.data = { type, id: value };
  } else {
    relationship.data = { type, id: value.id };
  }

  return relationship;
}

function isHasMany(value: RecordIdentity | RecordIdentity[] | string | string[] | null): value is RecordIdentity[] | string[] {
  return Array.isArray(value);
}
