/**
 @module ember-orbit
 */

var get = Ember.get;

var proxyProperty = function(source, property, defaultValue) {
  var _property = '_' + property;

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
};

var Schema = Ember.Object.extend({
  /**
   @property pluralize
   @type {function}
   @default OC.Schema.pluralize
   */
  pluralize: proxyProperty('_orbitSchema', 'pluralize'),

  /**
   @property singularize
   @type {function}
   @default OC.Schema.singularize
   */
  singularize: proxyProperty('_orbitSchema', 'singularize'),

  init: function() {
    this._super.apply(this, arguments);
    this._modelTypeMap = {};

    // Don't use `modelDefaults` in ember-orbit.
    // The same functionality can be achieved with a base model class that
    // can be overridden.
    var options = {
      modelDefaults: {}
    };

    var pluralize = this.get('pluralize');
    if (pluralize) {
      options.pluralize = pluralize;
    }

    var singularize = this.get('singularize');
    if (singularize) {
      options.singularize = singularize;
    }

    // Lazy load model definitions as they are requested.
    var _this = this;
    this.get('_orbitSchema').modelNotDefined = function(type) {
      _this.modelFor(type);
    };
  },

  defineModel: function(type, modelClass) {
    const definedModels = this._orbitSchema.models;
    if (definedModels[type]) return;

    this._orbitSchema.registerModel(type, {
      keys: get(modelClass, 'keys'),
      attributes: get(modelClass, 'attributes'),
      relationships: get(modelClass, 'relationships')
    });
  },

  modelFor: function(type) {
    Ember.assert("`type` must be a string", typeof type === 'string');

    var model = this._modelTypeMap[type];
    if (!model) {
      model = get(this, 'container').lookupFactory('model:' + type);

      if (!model) {
        throw new Ember.Error("No model was found for '" + type + "'");
      }

      model.typeKey = type;

      // ensure model is defined in underlying OC.Schema
      console.log('defining', type, model);
      this.defineModel(type, model);

      // save model in map for faster lookups
      this._modelTypeMap[type] = model;

      // look up related models
      this.relationships(type).forEach(function(relationship) {
        this.modelFor(this.relationshipProperties(type, relationship).model);
      }, this);
    }

    return model;
  },

  models: function() {
    return Object.keys(this._orbitSchema.models);
  },

  primaryKey: function(type) {
    return this._orbitSchema.models[type].primaryKey.name;
  },

  keys: function(type) {
    return Object.keys(this._orbitSchema.models[type].keys);
  },

  keyProperties: function(type, name) {
    return this._orbitSchema.models[type].keys[name];
  },

  attributes: function(type) {
    return Object.keys(this._orbitSchema.models[type].attributes);
  },

  attributeProperties: function(type, name) {
    return this._orbitSchema.models[type].attributes[name];
  },

  relationships: function(type) {
    return Object.keys(this._orbitSchema.models[type].relationships);
  },

  relationshipProperties: function(type, name) {
    return this._orbitSchema.models[type].relationships[name];
  },

  normalize(properties) {
    const normalizedProperties  = {
      id: properties.id,
      type: properties.type,
      attributes: {},
      relationships: {}
    };

    this.normalizeAttributes(properties, normalizedProperties);
    this.normalizeRelationships(properties, normalizedProperties);

    this._orbitSchema.normalize(normalizedProperties);

    console.log('normalized', normalizedProperties);
    return normalizedProperties;
  },

  normalizeAttributes(properties, normalizedProperties) {
    const attributes = this.attributes(properties.type);

    attributes.forEach(attribute => {
      console.log(attribute, properties[attribute]);
      normalizedProperties.attributes[attribute] = properties[attribute];
    });
  },

  normalizeRelationships(properties, normalizedProperties) {
    console.log('rels');
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
    if (!value) return;

    const relationship = normalizedProperties.relationships[relationshipName] = {};
    const modelType = relationshipProperties.model;

    if (Ember.isArray(value)) {
      relationship.data = {};

      value.forEach(function(id) {
        if (typeof id === 'object') {
          id = get(id, 'primaryId');
        }
        const identifier = [modelType, id].join(':');
        relationship.data[identifier] = true;
      });

    } else if (typeof value === 'object') {
      const identifier = [modelType, get(value, 'primaryId')].join(':');
      normalizedProperties.relationships[relationship] = identifier;

    } else {
      normalizedProperties.relationships[relationship] = [modelType, value].join(':');
    }
  }

});

export default Schema;
