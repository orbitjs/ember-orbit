import Orbit from 'orbit';
import Schema from 'ember_orbit/schema';
import attr from 'ember_orbit/attr';
import hasOne from 'ember_orbit/has_one';
import hasMany from 'ember_orbit/has_many';
import Model from 'ember_orbit/model';

var get = Ember.get,
    set = Ember.set;

var schema;

module("Unit - Schema", {
  setup: function() {
    schema = Schema.create();
  },

  teardown: function() {
    schema = null;
  }
});

test("it exists", function() {
  ok(schema);
});

test("#defineModel defines models on the underlying Orbit schema", function() {
  var Star,
      Moon,
      Planet;

  Star = Model.extend({
    name: attr('string'),
    planets: hasMany('planet')
  });

  Moon = Model.extend({
    name: attr('string'),
    planet: hasOne('planet')
  });

  Planet = Model.extend({
    name: attr('string'),
    classification: attr('string'),
    sun: hasOne('star'),
    moons: hasMany('moon')
  });         

  schema.defineModel('star', Star);
  schema.defineModel('moon', Moon);
  schema.defineModel('planet', Planet);

  deepEqual(schema._schema.models, 
    {
      "moon": {
        "attributes": {
          "name": {
            "isAttribute": true,
            "name": "name",
            "options": {},
            "type": "string"
          }
        },
        "links": {
          "planet": {
            "isLink": true,
            "name": "planet",
            "options": {
              "hasOne": true
            },
            "type": "planet"
          }
        }
      },
      "planet": {
        "attributes": {
          "classification": {
            "isAttribute": true,
            "name": "classification",
            "options": {},
            "type": "string"
          },
          "name": {
            "isAttribute": true,
            "name": "name",
            "options": {},
            "type": "string"
          }
        },
        "links": {
          "moons": {
            "isLink": true,
            "name": "moons",
            "options": {
              "hasOne": true
            },
            "type": "moon"
          },
          "sun": {
            "isLink": true,
            "name": "sun",
            "options": {
              "hasOne": true
            },
            "type": "star"
          }
        }
      },
      "star": {
        "attributes": {
          "name": {
            "isAttribute": true,
            "name": "name",
            "options": {},
            "type": "string"
          }
        },
        "links": {
          "planets": {
            "isLink": true,
            "name": "planets",
            "options": {
              "hasOne": true
            },
            "type": "planet"
          }
        }
      }
    }
  );
});
