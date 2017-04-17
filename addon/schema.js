import { Schema as OrbitSchema } from '@orbit/data';
import { deepSet } from '@orbit/utils';
import getRegisteredModels from './-private/get-registered-models';

const {
  computed,
  get,
  getOwner,
  set
} = Ember;

function proxyProperty(source, property, defaultValue) {
  const _property = '_' + property;

  return computed({
    set(key, value) {
      if (arguments.length > 1) {
        this[_property] = value;
        if (this[source]) {
          this[source][property] = value;
        }
      }
      if (!this[_property]) {
        this[_property] = defaultValue;
      }
      return this[_property];
    },

    get() {
      if (!this[_property]) {
        this[_property] = defaultValue;
      }
      return this[_property];
    }
  });
}

export default Ember.Object.extend({
  orbitSchema: null,

  modelDefinitions: proxyProperty('orbitSchema', 'models'),

  pluralize: proxyProperty('orbitSchema', 'pluralize'),

  singularize: proxyProperty('orbitSchema', 'singularize'),

  init() {
    this._super(...arguments);
    this._modelTypeMap = {};

    if (!this.orbitSchema) {
      const options = {};

      const pluralize = get(this, 'pluralize');
      if (pluralize) {
        options.pluralize = pluralize;
      }

      const singularize = get(this, 'singularize');
      if (singularize) {
        options.singularize = singularize;
      }

      let modelDefinitions = get(this, 'modelDefinitions');
      if (!modelDefinitions) {
        modelDefinitions = this._buildModelDefinitions();
      }

      options.models = modelDefinitions;

      this.orbitSchema = new OrbitSchema(options);
    }
  },

  _buildModelDefinitions() {
    const models = {};
    
    get(this, 'types').forEach(type => {
      models[type] = this._modelSchemaFor(type);
    });

    set(this, 'modelDefinitions', models);

    return models;
  },

  _modelSchemaFor(type) {
    const model = this.modelFor(type);
    return {
      id: get(model, 'id'),
      keys: get(model, 'keys'),
      attributes: get(model, 'attributes'),
      relationships: get(model, 'relationships')
    };
  },

  modelFor(type) {
    let model = this._modelTypeMap[type];

    if (!model) {
      model = getOwner(this)._lookupFactory(`model:${type}`);
      model.typeKey = type;
      this._modelTypeMap[type] = model;
    }

    return model;
  },

  types: computed(function() {
    if (this.orbitSchema && this.orbitSchema.models) {
      return Object.keys(this.orbitSchema.models);
    } else {
      return getRegisteredModels(getOwner(this).base);
    }
  }),

  keys(type) {
    return Object.keys(this.orbitSchema.models[type].keys);
  },

  keyProperties(type, name) {
    return this.orbitSchema.models[type].keys[name];
  },

  attributes(type) {
    return Object.keys(this.orbitSchema.models[type].attributes);
  },

  attributeProperties(type, name) {
    return this.orbitSchema.models[type].attributes[name];
  },

  relationships(type) {
    return Object.keys(this.orbitSchema.models[type].relationships);
  },

  relationshipProperties(type, name) {
    return this.orbitSchema.models[type].relationships[name];
  },

  normalize(properties) {
    const record = {
      id: properties.id || this.orbitSchema.generateId(properties.type),
      type: properties.type
    };

    this.assignKeys(record, properties);
    this.assignAttributes(record, properties);
    this.assignRelationships(record, properties);

    return record;
  },

  assignKeys(record, properties) {
    this.keys(record.type).forEach(key => {
      if (properties[key] !== undefined) {
        deepSet(record, ['keys', key], properties[key]);
      }
    });
  },

  assignAttributes(record, properties) {
    this.attributes(record.type).forEach(attribute => {
      if (properties[attribute] !== undefined) {
        deepSet(record, ['attributes', attribute], properties[attribute]);
      }
    });
  },

  assignRelationships(record, properties) {
    this.relationships(record.type).forEach(relationshipName => {
      if (properties[relationshipName] !== undefined) {
        record.relationships = record.relationships || {};
        const relationshipProperties = this.relationshipProperties(properties.type, relationshipName);
        this._normalizeRelationship(record, properties, relationshipName, relationshipProperties);
      }
    });
  },

  _normalizeRelationship(record, properties, relationshipName, relationshipProperties) {
    const value = properties[relationshipName];
    const relationship = record.relationships[relationshipName] = {};
    const modelType = relationshipProperties.model;

    if (Ember.isArray(value)) {
      relationship.data = {};

      value.forEach(function(id) {
        if (typeof id === 'object') {
          id = get(id, 'id');
        }
        const identifier = [modelType, id].join(':');
        relationship.data[identifier] = true;
      });

    } else if (typeof value === 'object') {

      const identifier = [modelType, get(value, 'id')].join(':');
      relationship.data = identifier;

    } else {
      relationship.data = [modelType, value].join(':');
    }
  }
});
