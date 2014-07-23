import OrbitSchema from 'orbit-common/schema';

/**
 @module ember-orbit
 */

var get = Ember.get;

var proxyProperty = function(source, property, defaultValue) {
  var _property = '_' + property;

  return function(key, value) {
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
  }.property();
};

var Schema = Ember.Object.extend({
  /**
   @property idField
   @type {String}
   @default 'clientid'
   */
  idField: proxyProperty('_schema', 'idField', 'clientid'),

  /**
   @property remoteIdField
   @type {String}
   @default 'id'
   */
  remoteIdField: proxyProperty('_schema', 'remoteIdField', 'id'),

  /**
   @property generateId
   @type {function}
   @default OC.Schema.generateId
   */
  generateId: proxyProperty('_schema', 'generateId'),

  /**
   @property pluralize
   @type {function}
   @default OC.Schema.pluralize
   */
  pluralize: proxyProperty('_schema', 'pluralize'),

  /**
   @property singularize
   @type {function}
   @default OC.Schema.singularize
   */
  singularize: proxyProperty('_schema', 'singularize'),

  init: function() {
    this._super.apply(this, arguments);
    this._modelTypeMap = {};

    var options = {
      idField: get(this, 'idField'),
      remoteIdField: get(this, 'remoteIdField')
    };

    var generateId = this.get('generateId');
    if (generateId) {
      options.generateId = generateId;
    }

    var pluralize = this.get('pluralize');
    if (pluralize) {
      options.pluralize = pluralize;
    }

    var singularize = this.get('singularize');
    if (singularize) {
      options.singularize = singularize;
    }

    this._schema = new OrbitSchema(options);
  },

  defineModel: function(type, modelClass) {
    var definedModels = this._schema.models;
    if (!definedModels[type]) {
      this._schema.registerModel(type, {
        attributes: get(modelClass, 'attributes'),
        links: get(modelClass, 'links')
      });
    }
  },

  modelFor: function(type) {
    Ember.assert("`type` must be a string", typeof type === 'string');

    var model = this._modelTypeMap[type];
    if (!model) {
      model = this.container.lookupFactory('model:' + type);
      if (!model) {
        throw new Ember.Error("No model was found for '" + type + "'");
      }
      model.typeKey = type;

      // ensure model is defined in underlying OC.Schema
      this.defineModel(type, model);

      // save model in map for faster lookups
      this._modelTypeMap[type] = model;

      // look up related models
      this.links(type).forEach(function(link) {
        this.modelFor(this.linkProperties(type, link).model);
      }, this);
    }

    return model;
  },

  models: function() {
    return Object.keys(this._schema.models);
  },

  attributes: function(type) {
    return Object.keys(this._schema.models[type].attributes);
  },

  attributeProperties: function(type, name) {
    return this._schema.models[type].attributes[name];
  },

  links: function(type) {
    return Object.keys(this._schema.models[type].links);
  },

  linkProperties: function(type, name) {
    return this._schema.models[type].links[name];
  },

  normalize: function(type, data) {
    return this._schema.normalize(type, data);
  }
});

export default Schema;