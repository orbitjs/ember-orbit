import OrbitSchema from 'orbit/schema';
import getRegisteredModels from './-private/get-registered-models';

/**
 @module ember-orbit
 */

const {
  computed,
  get,
  getOwner
} = Ember;

function proxyProperty(source, property, defaultValue) {
  const _property = '_' + property;

  return Ember.computed({
    set: function(key, value) {
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
    get: function() {
      if (!this[_property]) {
        this[_property] = defaultValue;
      }
      return this[_property];
    }
  });
}

export default Ember.Object.extend({
  orbitSchema: null,

  /**
   @property pluralize
   @type {function}
   @default Schema.pluralize
   */
  pluralize: proxyProperty('orbitSchema', 'pluralize'),

  /**
   @property singularize
   @type {function}
   @default Schema.singularize
   */
  singularize: proxyProperty('orbitSchema', 'singularize'),

  init() {
    this._super(...arguments);
    this._modelTypeMap = {};

    if (!this.orbitSchema) {
      // Don't use `modelDefaults` in ember-orbit.
      // The same functionality can be achieved with a base model class that
      // can be overridden.
      const options = {
        modelDefaults: {}
      };

      const pluralize = this.get('pluralize');
      if (pluralize) {
        options.pluralize = pluralize;
      }

      const singularize = this.get('singularize');
      if (singularize) {
        options.singularize = singularize;
      }

      options.models = this._modelsSchema();

      this.orbitSchema = new OrbitSchema(options);
    }
  },

  _modelsSchema() {
    const models = {};
    this.get('types').forEach(type => {
      models[type] = this._modelSchemaFor(type);
    });
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
    return Object.keys(this.orbitSchema.modelDefinition(type).keys);
  },

  keyProperties(type, name) {
    return this.orbitSchema.modelDefinition(type).keys[name];
  },

  attributes(type) {
    return Object.keys(this.orbitSchema.modelDefinition(type).attributes);
  },

  attributeProperties(type, name) {
    return this.orbitSchema.modelDefinition(type).attributes[name];
  },

  relationships(type) {
    return Object.keys(this.orbitSchema.modelDefinition(type).relationships);
  },

  relationshipProperties(type, name) {
    return this.orbitSchema.modelDefinition(type).relationships[name];
  },

  normalize(properties) {
    const normalizedProperties  = {
      id: properties.id,
      type: properties.type,
      keys: {},
      attributes: {},
      relationships: {}
    };

    this.normalizeKeys(properties, normalizedProperties);
    this.normalizeAttributes(properties, normalizedProperties);
    this.normalizeRelationships(properties, normalizedProperties);
    this.orbitSchema.normalize(normalizedProperties);

    return normalizedProperties;
  },

  normalizeKeys(properties, normalizedProperties) {
    this.keys(properties.type).forEach(key => {
      normalizedProperties.keys[key] = properties[key];
    });
  },

  normalizeAttributes(properties, normalizedProperties) {
    const attributes = this.attributes(properties.type);

    attributes.forEach(attribute => {
      normalizedProperties.attributes[attribute] = properties[attribute];
    });
  },

  normalizeRelationships(properties, normalizedProperties) {
    // Normalize links to IDs contained within the `__rel` (i.e. "forward link")
    // element.

    if (!normalizedProperties.relationships) {
      normalizedProperties.relationships = {};
    }

    this.relationships(properties.type).forEach(relationshipName => {
      const relationshipProperties = this.relationshipProperties(properties.type, relationshipName);
      this._normalizeRelationship(properties, normalizedProperties, relationshipName, relationshipProperties);
    });
  },

  _normalizeRelationship(properties, normalizedProperties, relationshipName, relationshipProperties) {
    const value = properties[relationshipName];
    if (!value) {
      return;
    }

    const relationship = normalizedProperties.relationships[relationshipName] = {};
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
