# Ember-Orbit [![Build Status](https://secure.travis-ci.org/orbitjs/ember-orbit.png?branch=master)](http://travis-ci.org/orbitjs/ember-orbit)

Ember-Orbit is a library that integrates
[Orbit.js](https://github.com/orbitjs/orbit.js) with
[Ember.js](https://github.com/emberjs/ember.js) to provide flexibility and
control in your application's data layer.

Ember-Orbit features:

* Compatibility with any sources that implement interfaces from the Orbit Common
  library.

* Stores that wrap Orbit sources and provide access to their underlying data as
  easy to use records and record arrays.

* Stores that can be cloned (fully or partially) and edited in isolation, so
  changes can be either discarded or applied back to the original source.

* Live-updating filtered record arrays and model relationships.

* A data schema that's declared through simple model definitions.

* The ability to connect any number of sources together with Orbit transform
  and request connectors.

* Deterministic change tracking including forward, inverse and transactional
  changes.


## Status

Ember-Orbit is undergoing heavy development. Interfaces may change, so please
use with caution.

Many capabilities of Orbit must still be accessed through Orbit objects that are
not yet fully encapsulated by Ember-Orbit. There are plans to "Emberify" these
aspects of Orbit so that they are more easily and consistently used from with
Ember-Orbit.


## Installation

Orbit and Ember-Orbit can be installed with [Bower](http://bower.io):

```
bower install orbit.js
bower install ember-orbit
```

[A separate shim repo](https://github.com/orbitjs/bower-ember-orbit) is
maintained for Ember-Orbit's Bower releases.


## Using Ember-Orbit

### Configuration

For an Ember CLI application, see the instructions further below.

If you just want to use the global (non-AMD) builds of Orbit and
Ember-Orbit, include the following scripts on your page:

```
<script src="/bower_components/orbit.js/orbit.js"></script>
<script src="/bower_components/orbit.js/orbit-common.js"></script>
<script src="/bower_components/ember-orbit/ember-orbit.js"></script>
```

These three files will provide the `Orbit`, `OC`, and `EO` global namespaces,
respectively.

You may also want to include scripts that provide additional Orbit sources.


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

* `key()` - keys
* `attr()` - attributes
* `hasOne()` - has-one relationships
* `hasMany()` - has-many relationships

#### Keys

Keys uniquely identify a record of a particular model type.

Every model must define a single "primary key", which will be used throughout
Orbit to identify records of that type uniquely. This should be indicated with
the field option `primaryKey: true`.

If no primary key is defined on a model, a single primary key named `id` will be
automatically generated. This key's `defaultValue` will be set to the v4 UUID
generator used within Orbit.

When working with remote servers that do not support UUID primary keys, it's
necessary to correlate Orbit IDs with IDs that are generated remotely. In order
to support this scenario, one or more "secondary keys" may also be defined for
a model.

Let's say that you want to track Orbit's primary key locally as a UUID named
`cid` and also define a remote key named `id`. You could define the following
keys in all models by modifying the base `Model` class:

```javascript
  Model.reopen({
    cid: key({primaryKey: true, defaultValue: uuid}),
    id:  key()
  });
```

Note that Orbit can maintain different keys across different models, even in the
same schema.

#### Relationships

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

### Accessing and Modifying Records

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

A model's relationships can be re-queried by calling `reload()` on a
relationship object. This triggers the associated `findLink` call and returns
its promise. Related records will be updated through transformations to the
underlying source. Any changes should be reflected by the time the promise
resolves.

For example:

```javascript
planet.get('moons').reload().then(function() {
  console.log(planet.get('moons.length'));
});
```

### Direct Access to Orbit

Many aspects of Orbit are not yet encapsulated by Ember-Orbit and must be
handled by working with the underlying Orbit sources directly.

Orbit sources can be directly accessed in any `EO.Source` (or `EO.Store`) via
`orbitSource`.

Use sources to configure connectors, monitor transforms, and access remote
servers.

### Configuration with Ember-CLI

First, remove `ember-data`, which is configured by default:

```
npm rm ember-data --save-dev
bower uninstall --save ember-data
```

Next, add `orbit.js` and `ember-orbit` as dependencies in `bower.json` and
install them by running this command.

```
bower install --save orbit.js ember-orbit
```

In your `Brocfile`, import dependencies for Orbit and Ember-Orbit. It's
recommended that you import the named AMD ('.amd.js') files so that modules
may be used within ember-cli.

For example:

```javascript
var EmberApp = require('ember-cli/lib/broccoli/ember-app');

var app = new EmberApp();

// Required Orbit imports
app.import('bower_components/orbit.js/orbit.amd.js', {
  exports: {'orbit': ['default']}
});
app.import('bower_components/orbit.js/orbit-common.amd.js', {
  exports: {'orbit-common': ['default']}
});

// Optional import of local storage source
app.import('bower_components/orbit.js/orbit-common-local-storage.amd.js', {
  exports: {'orbit-common/local-storage-source': ['default']}
});

// Optional import of JSON API source and serializer
app.import('bower_components/orbit.js/orbit-common-jsonapi.amd.js', {
  exports: {'orbit-common/jsonapi-source': ['default'],
            'orbit-common/jsonapi-serializer': ['default']}
});

// Required Ember-Orbit import
app.import('bower_components/ember-orbit/ember-orbit.amd.js', {
  exports: {'ember-orbit': ['default']}
});

module.exports = app.toTree();
```

Create an initializer for Ember-Orbit within your application's `initializers`
directory.

The following example creates a store backed by local storage:

```javascript
import Ember from 'ember';
import Orbit from 'orbit';
import LocalStorageSource from 'orbit-common/local-storage-source';
import EO from 'ember-orbit';
import config from '../config/environment';

var LocalStorageStore = EO.Store.extend({
  orbitSourceClass: LocalStorageSource,
  orbitSourceOptions: {
    namespace: config.modulePrefix // n.s. for localStorage
  }
});

export var initialize = function(container, application) {
  Orbit.Promise = Ember.RSVP.Promise;
  application.register('schema:main', EO.Schema);
  application.register('store:main', LocalStorageStore);
  application.inject('controller', 'store', 'store:main');
  application.inject('route', 'store', 'store:main');
};

export default {
  name: 'inject-store',

  initialize: initialize
};
```

### Customizing schema

You can customize functions used to pluralize/singularize model and field names:

```javascript
var Schema = EO.Schema.extend({
  pluralize: function(word){
    // information is irregular
    return word === 'information' ? 'information' : word + 's';
  },

  singularize: function(word){
    // information is irregular
    return word === 'information' ? 'information' : word.substr(0, word.length - 1);
  }
});
```

Customization of ID fields and generators should be done on individual models.

### Example Ember-Orbit / Ember-CLI Application

In addition to this documentation, you may find it helpful to see an example
application that works works with Ember-Orbit and Ember-CLI:

https://github.com/opsb/ember-orbit-todos

## Contributing

### Installing Ember-Orbit

Install the CLI for [Broccoli](https://github.com/broccolijs/broccoli) globally:

```
npm install -g broccoli-cli
```

Install the rest of ember-orbit's dependencies:

```
npm install
```

### Building Ember-Orbit

Distributable versions of ember-orbit can be built to the `/build` directory
by running:

```
npm run build
```

### Testing Ember-Orbit

#### CI Testing

ember-orbit can be tested in CI mode by running:

```
npm test
```

Or directly with testem (useful for configuring options):

```
testem ci
```

#### Browser Testing

ember-orbit can be tested within a browser
(at [http://localhost:4200/tests/](http://localhost:4200/tests/)) by running:

```
npm start
```

Or directly with `broccoli` (useful for configuring the port, etc.):

```
broccoli serve
```

### Generating Documentation

Install [yuidoc](http://yui.github.io/yuidoc/) globally:

```
npm install -g yuidocjs
```

Generate docs in the `/docs` directory:

```
yuidoc .
```

## Acknowledgments

Ember-Orbit owes a great deal to [Ember Data](https://github.com/emberjs/data),
not only for the design of several interfaces but also for the base code used to
manage record arrays.

It is hoped that, by tracking Ember Data's features and interfaces where
possible, Ember Orbit will also be able to contribute back to Ember Data.


## License

Copyright 2014 Cerebris Corporation. MIT License (see LICENSE for details).
