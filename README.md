ember-orbit
==============================================================================

[![Build Status](https://secure.travis-ci.org/orbitjs/ember-orbit.png?branch=master)](http://travis-ci.org/orbitjs/ember-orbit) [![Join the chat at https://gitter.im/orbitjs/orbit.js](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/orbitjs/orbit.js?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

`ember-orbit` (or "EO") is a library that integrates
[orbit.js](https://github.com/orbitjs/orbit) with
[ember.js](https://github.com/emberjs/ember.js) to provide flexibility and
control in your application's data layer.

Compatibility
------------------------------------------------------------------------------

* Ember.js v3.16 or above
* Ember CLI v2.13 or above
* Node.js v10 or above

EO features:

- Access to the full power of Orbit and its ecosystem, including compatible
  sources, buckets, and coordination strategies.

- A data schema that's declared through simple model definitions.

- Stores that wrap Orbit stores and provide access to their underlying data as
  easy to use records and record arrays. These stores can be forked, edited in
  isolation, and merged back to the original as a coalesced changeset.

- Live-updating filtered record arrays and model relationships.

- The full power of Orbit's composable query expressions.

- The ability to connect any number of sources together with Orbit coordination
  strategies.

- Orbit's git-like deterministic change tracking and history manipulation
  capabilities.

## Relationship to Orbit

EO provides a thin "Emberified" layer over the top of some core
primitives from Orbit, including `Store`, `Cache`, and `Model` classes. Most
common developer interactions with Orbit will be through these classes.

However, EO does not attempt to wrap _every_ base class from Orbit.
For instance, you'll need to use Orbit's `Coordinator` and coordination
strategies to define relationships between Orbit sources. In this way, you can
install any Orbit `Source` or `Bucket` library and wire them together in your
EO application.

> **Important**: It's strongly recommended that you read the Orbit guides at
> [orbitjs.com](http://orbitjs.com) before using EO, since an understanding of
> Orbit is vital to making the most of EO.

## Status

EO obeys [semver](http://semver.org) and thus should not be considered to have a
stable API until 1.0. Until then, any breaking changes in APIs or Orbit
dependencies should be accompanied by a minor version bump of EO.

## Demo

[todomvc-ember-orbit](https://github.com/orbitjs/todomvc-ember-orbit) is a
simple TodoMVC example that uses EO to illustrate a number of possible
configurations and application patterns.

Installation
------------------------------------------------------------------------------

As with any Ember addon, you can install EO in your project with:

```
ember install ember-orbit
```

EO depends on `ember-auto-import` to automatically import external
dependencies, including `@orbit/coordinator` and `@orbit/memory`.

The generators for orbit sources and buckets will attempt to install any
additional orbit-related dependencies.

Usage
------------------------------------------------------------------------------

EO creates the following directories by default:

- `app/data-buckets` - Factories for creating Orbit `Bucket`s, which are used
  to save / load orbit application state.

- `app/data-models` - For EO `Model` classes, which represent data records.

- `app/data-sources` - Factories for creating Orbit `Source`s, which represent
  different sources of data.

- `app/data-strategies` - Factories for creating Orbit coordination strategies.

Note that "factories" are simply objects with a `create` method that serves to
instantiate an object. The factory interface conforms with the expectations of
Ember's DI system.

EO installs the following services by default:

- `store` - An `ember-orbit` `Store` to manage querying and updating models.

- `dataCoordinator` - An `@orbit/coordinator` `Coordinator` that manages sources
  and coordination strategies between them.

- `dataSchema` - An `@orbit/data` `Schema` that represents a schema for models
  that is shared by the `store` and other sources.

- `dataKeyMap` - An `@orbit/data` `KeyMap` that manages a mapping between keys
  and local IDs for scenarios in which a server does not accept client-generated
  IDs.

By default, the `store` service is injected into every route and controller by
default. The `dataSchema` and `dataKeyMap` will be injected into every `Source`.

All the directories and services configured by EO can be customized for your
app, as described in the "Customizing EO" section below.

### Defining models

Models are used to access the underlying data in an EO `Store`.
They provide a proxy to get and set attributes and relationships. In addition,
models are used to define the schema that's shared by the sources in your
Orbit application.

The easiest way to create a `Model` is with the `data-model` generator:

```
ember g data-model planet
```

This will create the following module in `app/data-models/planet.js`:

```js
import { Model } from 'ember-orbit';

export default class Planet extends Model {}
```

You can then extend your model to include keys, attributes, and relationships:

```js
import { Model, attr, hasOne, hasMany, key } from 'ember-orbit';

export default class Planet extends Model {
  @attr('string') name;
  @hasMany('moon', { inverse: 'planet' }) moons;
  @hasOne('star') sun;
}
```

You can create polymorphic relationships by passing in an array of types:

```js
import { Model, attr, hasOne, hasMany } from 'ember-orbit';

export default class PlanetarySystem extends Model {
  @attr('string') name;
  @hasMany(['moon', 'planet']) bodies;
  @hasOne(['star', 'binaryStar']) star;
}
```

### Adding records

Records can be added in a couple ways. The easiest is to use the `addRecord`
method on the store:

```javascript
let planet = await store.addRecord({ type: 'planet', name: 'Earth' });
console.log(planet.name); // Earth
```

Alternatively, you can call `store.update()` and use the transform builder to
build up a single `Transform` with any number of operations:

```javascript
// planets added in a single `Transform`
let planets = await store.update(t => [
  t.addRecord({ type: 'planet', attributes: { name: 'Earth' } }),
  t.addRecord({ type: 'planet', attributes: { name: 'Venus' } })
]);
```

> Note: calling `update` is a direct passthrough to the underlying Orbit store,
> so it's important to specify records in their full normalized form
> (see [the Orbit guides](http://orbitjs.com/v0.15/guide/modeling-data.html#Records)).

### Querying records

There are three unique methods used to query records:

- `store.query()` - returns a promise that resolves to a static recordset.

- `store.liveQuery()` - returns a promise that resolves to a live recordset that
  will be refreshed whenever the store's data changes.

- `store.cache.query()` - returns a static set of in-memory results immediately.

All of these query methods take the same arguments as any other queryable
Orbit source - see
[the Orbit guides](http://orbitjs.com/v0.15/guide/querying-data.html) for
details.

For example, the following `liveQuery` should return a promise that resolves
to a live resultset that will stay updated with the "terrestrial" planets in
the store:

```javascript
let planets = await store.liveQuery(qb =>
  qb
    .findRecords('planet')
    .filter({ attribute: 'classification', value: 'terrestrial' })
);
```

Unlike the Orbit `Store`, in which results are returned as static POJOs,
results from EO queries are returned as records, i.e. instantiated
versions of their associated `Model` class.

The attributes and relationships of records will be kept in sync with the
backing store.

Note that the EO `Store` also supports the `find` method for
compatibility with Ember's default expectations in routes. The following
queries are async and call `store.query` internally:

```javascript
// find all records of a type
store.find('planet');

// find a specific record by type and id
store.find('planet', 'abc123');
```

The following queries are synchronous and call `store.cache.query` internally:

```javascript
// find all records of a type
store.cache.find('planet');

// find a specific record by type and id
store.cache.find('planet', 'abc123');
```

### Updating records

Any records retrieved from a store or its cache will stay sync'd with the
contents of that cache. Each attribute and relationship is a computed property
that has getters and setters which pass through to the underlying store.

Let's say that you find a couple records directly in the store's cache and
want to edit them:

```javascript
let jupiter = store.cache.find('planet', 'jupiter');
let io = store.cache.find('moon', 'io');
let europa = store.cache.find('moon', 'europa');
let sun = store.cache.find('star', 'theSun');

jupiter.set('name', 'JUPITER!');
jupiter.get('moons').pushObject(io);
jupiter.get('moons').removeObject(europa);
jupiter.set('sun', sun);
```

Behind the scenes, these changes each result in a call to `store.update`. Of
course, this method could also be called directly.

### Forking and merging stores

Because EO stores and caches are just thin wrappers over their
underlying Orbit equivalents, they share the same basic capabilities.
Thus, EO stores can be forked and merged, just as described in the
[Orbit guides](http://orbitjs.com/v0.15/guide/data-stores.html#Forking-stores).

The same example can be followed:

```javascript
  // start by adding two planets and a moon to the store
  await store.update(t => [
    t.addRecord(earth),
    t.addRecord(venus),
    t.addRecord(theMoon)
  ]);

  let planets = await store.query(q => q.findRecords('planet').sort('name')));
  console.log('original planets');
  console.log(planets);

  // fork the store
  forkedStore = store.fork();

  // add a planet and moons to the fork
  await forkedStore.update(t => [
    t.addRecord(jupiter),
    t.addRecord(io),
    t.addRecord(europa)
  ]);

  // query the planets in the forked store
  planets = await forkedStore.query(q => q.findRecords('planet').sort('name')));
  console.log('planets in fork');
  console.log(planets);

  // merge the forked store back into the original store
  await store.merge(forkedStore);

  // query the planets in the original store
  planets = await store.query(q => q.findRecords('planet').sort('name')));
  console.log('merged planets');
  console.log(planets);
```

And the same notes apply:

- Once a store has been forked, the original and forked stores’ data can diverge
  independently.

- A store fork can simply be abandoned without cost.

- Merging a fork will gather the transforms applied since the fork point,
  coalesce the operations in those transforms into a single new transform, and
  then update the original store.

> **Important** - One additional concern to be aware of is that EO will
> generate new records for each store. Care should be taken to not mix records
> between stores, since the underlying data in each store can diverge. If you need
> to access a record in a store's fork, just query the forked store or cache for
> that record.

### Adding a "backup" source

The store's contents exist only in memory and will be cleared every time your
app restarts. Let's try adding another source and use the `dataCoordinator`
service to keep it in sync with the store.

We can use the `data-source` generator to create a `backup` source:

```
ember g data-source backup --from=@orbit/indexeddb
```

This will generate a source factory in `app/data-sources/backup.js`:

```javascript
import SourceClass from '@orbit/indexeddb';

export default {
  create(injections = {}) {
    injections.name = 'backup';
    return new SourceClass(injections);
  }
};
```

Note that `injections` should include both a `Schema` and a `KeyMap`, which
are injected by default for every EO application. We're also adding
a `name` to uniquely identify the source within the coordinator. You could
optionally specify a `namespace` to be used to name the IndexedDB database.

Every source that's defined in `app/data-sources` will be discovered
automatically by EO and added to the `dataCoordinator` service.

Next let's define some strategies to synchronize data between sources.

### Defining coordination strategies

There are four different types of coordination strategies that can be generated
by default using the standard `data-strategy` generator:

- `request`
- `sync`
- `event-logging`
- `log-truncation`

Let's define a sync strategy to backup changes made to the store into our new
`backup` source.

```
ember g data-strategy store-backup-sync --type=sync
```

This should create a `SyncStrategy` factory in
`app/data-strategies/store-backup-sync.js` as follows:

```js
import { SyncStrategy } from '@orbit/coordinator';

export default {
  create() {
    return new SyncStrategy({
      name: 'store-backup-sync',

      /**
       * The name of the source which will have its `transform` event observed.
       */
      source: 'store',

      /**
       * The name of the source which will be acted upon.
       *
       * When the source receives the `transform` event, the `sync` method
       * will be invoked on the target.
       */
      target: 'backup',

      /**
       * A handler for any errors thrown as a result of invoking `sync` on the
       * target.
       */
      // catch(e) {},

      /**
       * A filter function that returns `true` if `sync` should be performed.
       *
       * `filter` will be invoked in the context of this strategy (and thus will
       * have access to both `this.source` and `this.target`).
       */
      // filter(...args) {};

      /**
       * Should resolution of the target's `sync` block the completion of the
       * source's `transform`?
       *
       * Can be specified as a boolean or a function which which will be
       * invoked in the context of this strategy (and thus will have access to
       * both `this.source` and `this.target`).
       */
      blocking: true
    });
  }
};
```

You should also consider adding an event logging strategy to log events emitted
from your sources to the browser console:

```
ember g data-strategy event-logging
```

Sources have another kind of log as well: a transform log, which tracks
transforms that are applied. A log truncation strategy will keep the size of
transform logs in check. It observes the sources associated with the strategy
and truncates their transform logs when a common transform has been applied
to them all. Let's add a log truncation strategy as well:

```
ember g data-strategy log-truncation
```

### Activating the coordinator

Next we'll need to activate our coordinator as part of our app's boot process.
The coordinator requires an explicit activation step because the process is
async _and_ we may want to allow developers to do work beforehand.

In our case, we want to restore our store from the backup source before we
enable the coordinator. Let's do this in our application route's `beforeModel`
hook (in `app/routes/application.js`):

```js
import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class ApplicationRoute extends Route {
  @service dataCoordinator;

  async beforeModel() {
    // Populate the store from backup prior to activating the coordinator
    const backup = this.dataCoordinator.getSource('backup');
    const transform = await backup.pull(q => q.findRecords());
    await this.store.sync(transform);

    await this.dataCoordinator.activate();
  }
}
```

This code first pulls all the records from backup and then syncs them
with the main store _before_ activating the coordinator. In this way, the
coordination strategy that backs up the store won't be enabled until after
the restore is complete.

### Defining a data bucket

Data buckets are used by sources and key maps to load and persist state. To
create a new bucket, run the generator:

```
ember g data-bucket main
```

By default this will create a new bucket factory based on `@orbit/indexeddb-bucket`.
It will also create an initializer that injects this bucket into all your
sources and key maps.

### Customizing EO

The types, collections, and services used by EO can all be customized for
your application via settings under the `orbit` key in `config/environment`:

```js
module.exports = function(environment) {
  let ENV = {
    // ... other settings here

    // Default Orbit settings (any of which can be overridden)
    orbit: {
      types: {
        bucket: 'data-bucket',
        model: 'data-model',
        source: 'data-source',
        strategy: 'data-strategy'
      },
      collections: {
        buckets: 'data-buckets',
        models: 'data-models',
        sources: 'data-sources',
        strategies: 'data-strategies'
      },
      services: {
        store: 'store',
        coordinator: 'data-coordinator',
        schema: 'data-schema',
        keyMap: 'data-key-map'
      },
      skipStoreService: false,
      skipCoordinatorService: false,
      skipSchemaService: false,
      skipKeyMapService: false
    }
  };

  return ENV;
};
```

## Contributing to EO

### Installation

- `git clone https://github.com/orbitjs/ember-orbit.git`
- `cd ember-orbit`
- `yarn install`

### Running Tests

- `yarn test`

## Acknowledgments

EO owes a great deal to [Ember Data](https://github.com/emberjs/data),
which has influenced the design of many of EO's interfaces. Many thanks
to the Ember Data Core Team, including Yehuda Katz, Tom Dale, and Igor Terzic,
for their work.

It is hoped that, by tracking Ember Data's features and interfaces where
possible, EO will also be able to contribute back to Ember Data.

License
------------------------------------------------------------------------------

Copyright 2014-2020 Cerebris Corporation. MIT License (see LICENSE for details).
