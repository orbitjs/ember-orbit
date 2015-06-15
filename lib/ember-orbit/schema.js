import OrbitSchema from 'orbit-common/schema';

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

    this._schema = new OrbitSchema(options);
  },

  defineModel: function(type, modelClass) {
    var definedModels = this._schema.models;
    if (!definedModels[type]) {
      this._schema.registerModel(type, {
        keys: get(modelClass, 'keys'),
        attributes: get(modelClass, 'attributes'),
        links: get(modelClass, 'links')
      });
    }
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

  primaryKey: function(type) {
    return this._schema.models[type].primaryKey.name;
  },

  primaryKeyProperties: function(type) {
    return this._schema.models[type].primaryKey;
  },

  keys: function(type) {
    return Object.keys(this._schema.models[type].keys);
  },

  keyProperties: function(type, name) {
    return this._schema.models[type].keys[name];
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

  normalize: function(type, record) {
    // Normalize links to IDs contained within the `__rel` (i.e. "forward link")
    // element.
    this.links(type).forEach(function(link) {
      if (!record.__rel) {
        record.__rel = {};
      }

      var linkValue = record[link];
      if (linkValue) {
        if (Ember.isArray(linkValue)) {
          var rel = record.__rel[link] = {};
          linkValue.forEach(function(id) {
            if (typeof id === 'object') {
              id = get(id, 'primaryId');
            }
            rel[id] = true;
          });

        } else if (typeof linkValue === 'object') {
          record.__rel[link] = get(linkValue, 'primaryId');

        } else {
          record.__rel[link] = linkValue;
        }

        delete record[link];
      }
    });

    this._schema.normalize(type, record);
  }
});

export default Schema;
