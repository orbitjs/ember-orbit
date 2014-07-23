import Orbit from 'orbit';
import Schema from 'ember-orbit/schema';
import attr from 'ember-orbit/attr';
import hasOne from 'ember-orbit/relationships/has-one';
import hasMany from 'ember-orbit/relationships/has-many';
import Model from 'ember-orbit/model';

var get = Ember.get,
    set = Ember.set;

var schema;

module("Unit - Schema", {
  setup: function() {
    Orbit.Promise = Ember.RSVP.Promise;
    schema = Schema.create();
  },

  teardown: function() {
    schema = null;
  }
});

test("it exists", function() {
  ok(schema);
});

test("it has an `idField` of `clientid` by default", function() {
  equal(get(schema, 'idField'), 'clientid');
});

test("its `idField` can be customized", function() {
  schema = Schema.create({idField: 'cid'});
  equal(get(schema, 'idField'), 'cid');
});

test("it has a `remoteIdField` of `id` by default", function() {
  equal(get(schema, 'remoteIdField'), 'id');
});

test("its `remoteIdField` can be customized", function() {
  schema = Schema.create({remoteIdField: '_id'});
  equal(get(schema, 'remoteIdField'), '_id');
});

test("it doesn't customize `generateId` by default", function() {
  equal(get(schema, 'generateId'), undefined);
});

test("its `generateId` can be customized", function() {
  var customGenerateId = function() { return 'abc'; };
  schema = Schema.create({generateId: customGenerateId});
  equal(get(schema, 'generateId'), customGenerateId);

  var Planet = Model.extend();
  var record = {};
  schema.defineModel('planet', Planet);
  record = schema.normalize('planet', record);
  equal(record.clientid, 'abc');
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

  deepEqual(schema.models(), ['star', 'moon', 'planet']);

  deepEqual(schema.attributes('star'), ['name']);
  deepEqual(schema.links('star'), ['planets']);
  deepEqual(schema.attributeProperties('star', 'name'), {
    type: "string"
  });
  deepEqual(schema.linkProperties('star', 'planets'), {
    type:  "hasMany",
    model: "planet"
  });

  deepEqual(schema.attributes('moon'), ['name']);
  deepEqual(schema.links('moon'), ['planet']);
  deepEqual(schema.attributeProperties('moon', 'name'), {
    type: "string"
  });
  deepEqual(schema.linkProperties('moon', 'planet'), {
    type:  "hasOne",
    model: "planet"
  });

  deepEqual(schema.attributes('planet'), ['name', 'classification']);
  deepEqual(schema.links('planet'), ['sun', 'moons']);
  deepEqual(schema.attributeProperties('planet', 'name'), {
    type: "string"
  });
  deepEqual(schema.attributeProperties('planet', 'classification'), {
    type: "string"
  });
  deepEqual(schema.linkProperties('planet', 'sun'), {
    type:  "hasOne",
    model: "star"
  });
  deepEqual(schema.linkProperties('planet', 'moons'), {
    type:  "hasMany",
    model: "moon"
  });
});

test("#modelFor returns the appropriate model when passed a model's name", function() {
  var Planet = Model.extend();

  var container = new Ember.Container();
  container.register('schema:main', Schema);
  container.register('model:planet', Planet);

  set(schema, 'container', container);

  equal(schema.modelFor('planet'), Planet);
});

test("#modelFor ensures that related models are also registered in the schema", function() {
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

  var container = new Ember.Container();
  container.register('schema:main', Schema);
  container.register('model:planet', Planet);
  container.register('model:star', Star);
  container.register('model:moon', Moon);

  set(schema, 'container', container);

  deepEqual(schema.models(), [], 'no models have been registered');

  schema.modelFor('planet');

  deepEqual(schema.models(), ['planet', 'star', 'moon'], 'all related models have been registered');
});
