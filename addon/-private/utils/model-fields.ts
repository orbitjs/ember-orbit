import { Orbit } from '@orbit/core';
import {
  RecordSchema,
  RecordRelationship,
  ModelDefinition,
  RecordIdentity,
  RelationshipDefinition,
  UninitializedRecord
} from '@orbit/records';
import { deepSet } from '@orbit/utils';

const { assert } = Orbit;

export type ModelFields = {
  type: string;
  id?: string;
  [property: string]: unknown;
};

export function normalizeModelFields(
  schema: RecordSchema,
  properties: ModelFields
): UninitializedRecord {
  const { id, type } = properties;
  const modelDefinition = schema.getModel(type);
  const record = { id, type } as UninitializedRecord;

  assignKeys(modelDefinition, record, properties);
  assignAttributes(modelDefinition, record, properties);
  assignRelationships(modelDefinition, record, properties);

  return record;
}

function assignKeys(
  modelDefinition: ModelDefinition,
  record: UninitializedRecord,
  properties: ModelFields
) {
  const keyDefs = modelDefinition.keys;
  if (keyDefs) {
    for (let key of Object.keys(keyDefs)) {
      if (properties[key] !== undefined) {
        deepSet(record, ['keys', key], properties[key]);
      }
    }
  }
}

function assignAttributes(
  modelDefinition: ModelDefinition,
  record: UninitializedRecord,
  properties: ModelFields
) {
  const attributeDefs = modelDefinition.attributes;
  if (attributeDefs) {
    for (let attribute of Object.keys(attributeDefs)) {
      if (properties[attribute] !== undefined) {
        deepSet(record, ['attributes', attribute], properties[attribute]);
      }
    }
  }
}

function assignRelationships(
  modelDefinition: ModelDefinition,
  record: UninitializedRecord,
  properties: ModelFields
) {
  const relationshipDefs = modelDefinition.relationships;
  if (relationshipDefs) {
    for (let relationship of Object.keys(relationshipDefs)) {
      if (properties[relationship] !== undefined) {
        let relationshipDef = relationshipDefs[
          relationship
        ] as RelationshipDefinition;
        let relationshipType = relationshipDef.type as string | string[];
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
