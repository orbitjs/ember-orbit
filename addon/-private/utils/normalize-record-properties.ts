import { Schema, RecordRelationship, Record } from '@orbit/data';
import { Dict, deepSet } from '@orbit/utils';

export default function normalizeRecordProperties(schema: Schema, properties: Dict<any>) {
  const { id, type } = properties;

  schema.getModel(type);

  const record = { id, type };

  assignKeys(schema, record, properties);
  assignAttributes(schema, record, properties);
  assignRelationships(schema, record, properties);

  return record;
}

function assignKeys(schema: Schema, record: Record, properties: Dict<any>) {
  const keys = schema.getModel(record.type).keys || {};
  Object.keys(keys).forEach(key => {
    if (properties[key] !== undefined) {
      deepSet(record, ['keys', key], properties[key]);
    }
  });
}

function assignAttributes(schema: Schema, record: Record, properties: Dict<any>) {
  const attributes = schema.getModel(record.type).attributes || {};
  Object.keys(attributes).forEach(attribute => {
    if (properties[attribute] !== undefined) {
      deepSet(record, ['attributes', attribute], properties[attribute]);
    }
  });
}

function assignRelationships(schema: Schema, record: Record, properties: Dict<any>) {
  const relationships = schema.getModel(record.type).relationships || {};
  Object.keys(relationships).forEach(relationshipName => {
    if (properties[relationshipName] !== undefined) {
      record.relationships = record.relationships || {};
      const relationshipProperties = relationships[relationshipName];
      normalizeRelationship(record, properties, relationshipName, relationshipProperties);
    }
  });
}

function normalizeRelationship(record: Record, properties: Dict<any>, relationshipName: string, relationshipProperties: Dict<any>) {
  const value = properties[relationshipName];
  const relationships = record.relationships || {};
  const relationship: RecordRelationship = relationships[relationshipName] = {};
  const type = relationshipProperties.model;

  if (Array.isArray(value)) {
    relationship.data = value.map(id => {
      if (typeof id === 'object') {
        id = id.id;
      }
      return { type, id };
    });
  } else if (value === null) {
    relationship.data = null;
  } else if (typeof value === 'object') {
    let id = value.id;
    relationship.data = { type, id };

  } else {
    let id = value;
    relationship.data = { type, id };
  }
}
