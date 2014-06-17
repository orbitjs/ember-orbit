# Ember-Orbit

Ember-Orbit is a library that integrates
[Orbit.js](https://github.com/orbitjs/orbit.js) with
[Ember.js](https://github.com/emberjs/ember.js).


## Status

Ember-Orbit is undergoing heavy development. Interfaces may change, so please
use with caution.

Many capabilities of Orbit must still be accessed through Orbit objects that are
not yet fully encapsulated by Ember-Orbit. There are plans to "Emberify" these
aspects of Orbit so that they are more easily and consistently used from with
Ember-Orbit.


## Installation

For now it is necessary to build Ember-Orbit from source. See instructions
below.


## Building and Testing Ember-Orbit

The Ember-Orbit project is managed by [Grunt](http://gruntjs.com/). Once you've
installed Grunt and its dependencies, you can install Ember-Orbit's development
dependencies from inside the project root with:

```
npm install
bower install
```

Distributable versions of Orbit can be built to the `/dist` directory by running:

```
grunt package
```

Orbit can be tested by running:

```
grunt test:ci
```

Or from within a browser
(at [http://localhost:8010/test/](http://localhost:8010/test/)) by running:

```
grunt server
```

Ember-Orbit's docs can be generated to the `/docs` directory by running:

```
grunt docs
```

## Using Ember-Orbit

### Initialization

Configure Ember-Orbit with an application initializer that sets up Orbit and
registers a "main" store and schema to be available in your routes and
controllers:

```javascript
  App.initializer({
    name: 'injectStore',
    initialize: function(container, application) {
      Orbit.Promise = Ember.RSVP.Promise;
      application.register('schema:main', EO.Schema);
      application.register('store:main', EO.Store);
      application.inject('controller', 'store', 'store:main');
      application.inject('route', 'store', 'store:main');
    }
  });
```

### Sources

Source are very thin wrappers over Orbit sources. A source can be declared as
follows:

```javascript
  LocalStorageSource = EO.Source.extend({
    orbitSourceClass: OC.LocalStorageSource,
    orbitSourceOptions: {
      namespace: "myApp" // n.s. for localStorage
    }
  });
```

Orbit sources can be directly accessed in any instantiated EO.Source via 
the `orbitSource` property.

### Stores

Stores extend sources and are also repositories for models. All of the data in a
store is maintained in its internal source.

Stores are by default defined with the `orbitSourceClass` set to an Orbit 
memory source class: `OC.MemorySource`.

Stores provide immediate (i.e. synchronous) access to its models through the
following methods:

* `all` - returns all models of a specific type. 
  For example: `store.all('planet')`.

* `filter` - returns a live record array of models of a specific type that are
  filtered by a filter function.

* `retrieve` - returns model with a specific client or remote id.
  For example: `store.retrieve('planet', '123')` or  
  `store.retrieve('planet', {id: '1'})`.

You can make requests to stores through the following asynchronous methods,
all of which return a promise:

* `find`
* `add`
* `remove`
* `patch`
* `findLink` 
* `addLink`
* `removeLink`

Stores themselves are promisified and resolve when all outstanding async
requests resolve. For example: `store.then(function() { didComplete() });`

It's often more convenient to call methods directly on records (i.e. model
instances).

### Models

Your model definitions help define the central schema used by Orbit throughout
your application.

Model definitions can use the following helpers:

* `attr()` - attributes
* `hasOne()` - has-one relationships
* `hasMany()` - has-many relationships

A relationship can optionally declare an `inverse`, which should point to a key
on the related model. Orbit will ensure that relationships and their inverses
will be updated together.

Here's an example set of model definitions:

```javascript
  Star = Model.extend({
    name: attr('string'),
    planets: hasMany('planet', {inverse: 'sun'})
  });

  Moon = Model.extend({
    name: attr('string'),
    planet: hasOne('planet', {inverse: 'moons'})
  });

  Planet = Model.extend({
    name: attr('string'),
    classification: attr('string'),
    sun: hasOne('star', {inverse: 'planets'}),
    moons: hasMany('moon', {inverse: 'planet'})
  });
```

Records can access properties and relationships through `get` and `set`.
Relationships are stored in proxy objects which will be kept in sync with
the underlying store's source data.

```javascript
store.add("planet", {name: "Jupiter"}).then(
  function(jupiter) {
    jupiter.get("moons").pushObject(io);
    jupiter.set("classification", "gas giant");
  }
);

store.then(function() { // all requests resolve
  console.log(io.get("planet.name")); // Jupiter - inverse relationship has resolved
});
```

You can also make requests to a model's underlying store through the following
asynchronous methods, all of which return a promise:

* `remove`
* `patch`
* `findLink` 
* `addLink`
* `removeLink`

Note that working with a model synchronously via `get` and `set` is generally
more convenient than calling the above async methods.

### Coming Soon

Many aspects of Orbit are not yet encapsulated by Ember-Orbit and must be
handled by working with the underlying Orbit sources directly.

Orbit sources can be directly accessed in any EO.Source (or EO.Store) via 
`orbitSource`.

Use sources to configure connectors, monitor transforms, and access remote
servers.

## Acknowledgments

Ember-Orbit owes a great deal to [Ember Data](https://github.com/emberjs/data),
not only for the design of several interfaces but also for the base code used to
manage record arrays.

It is hoped that, by tracking Ember Data's features and interfaces where
possible, Ember Orbit will also be able to contribute back to Ember Data.

## License

Copyright 2014 Cerebris Corporation. MIT License (see LICENSE for details).
