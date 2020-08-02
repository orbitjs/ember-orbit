import { Orbit } from '@orbit/core';
import {
  Schema,
  RecordRelationship,
  Record,
  ModelDefinition,
  RecordIdentity
} from '@orbit/data';
import { deepSet, Dict } from '@orbit/utils';

const { assert } = Orbit;

export default function normalizeRecordProperties(
  schema: Schema,
  properties: Dict<unknown>
) {
  const { id, type } = properties;
  const modelDefinition = schema.getModel(type as string);
  const record = { id, type } as Record;

  assignKeys(modelDefinition, record, properties);
  assignAttributes(modelDefinition, record, properties);
  assignRelationships(modelDefinition, record, properties);

  return record;
}

function assignKeys(
  modelDefinition: ModelDefinition,
  record: Record,
  properties: Dict<unknown>
) {
  const keys = modelDefinition.keys || {};
  for (let key of Object.keys(keys)) {
    if (properties[key] !== undefined) {
      deepSet(record, ['keys', key], properties[key]);
    }
  }
}

function assignAttributes(
  modelDefinition: ModelDefinition,
  record: Record,
  properties: Dict<unknown>
) {
  const attributes = modelDefinition.attributes || {};
  for (let attribute of Object.keys(attributes)) {
    if (properties[attribute] !== undefined) {
      deepSet(record, ['attributes', attribute], properties[attribute]);
    }
  }
}

function assignRelationships(
  modelDefinition: ModelDefinition,
  record: Record,
  properties: Dict<unknown>
) {
  const relationships = modelDefinition.relationships || {};
  for (let relationship of Object.keys(relationships)) {
    if (properties[relationship] !== undefined) {
      let relationshipType = relationships[relationship].type as
        | string
        | string[];
      let relationshipProperties = properties[relationship] as
        | RecordIdentity
        | RecordIdentity[]
        | string
        | string[]
        | null;
      deepSet(
        record,
        ['relationships', relationship],
        normalizeRelationship(relationshipType, relationshipProperties)
      );
    }
  }
}

function normalizeRelationship(
  type: string | string[],
  value: RecordIdentity | RecordIdentity[] | string | string[] | null
): RecordRelationship {
  const relationship: RecordRelationship = {};

  const isPolymorphic = Array.isArray(type);

  if (isHasMany(value)) {
    relationship.data = [];
    for (let identity of value) {
      if (typeof identity === 'string') {
        assert(
          'The hasMany relationship is polymorphic, so string[] will not work as a value. RecordIdentity[] must be provided for type information.',
          !isPolymorphic
        );
        relationship.data.push({ type: type as string, id: identity });
      } else {
        relationship.data.push({ type: identity.type, id: identity.id });
      }
    }
  } else if (value === null) {
    relationship.data = null;
  } else if (typeof value === 'string') {
    assert(
      'The relationship is polymorphic, so string will not work as a value. RecordIdentity must be provided for type information.',
      !isPolymorphic
    );
    relationship.data = { type: type as string, id: value };
  } else {
    relationship.data = { type: value.type, id: value.id };
  }

  return relationship;
}

function isHasMany(
  value: RecordIdentity | RecordIdentity[] | string | string[] | null
): value is RecordIdentity[] | string[] {
  return Array.isArray(value);
}
