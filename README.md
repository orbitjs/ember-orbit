# ember-orbit

[![Join the chat at https://gitter.im/orbitjs/orbit.js](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/orbitjs/orbit.js?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

`ember-orbit` (or "EO") is a library that integrates
[orbit.js](https://github.com/orbitjs/orbit) with
[ember.js](https://github.com/emberjs/ember.js) to provide flexibility and
control in your application's data layer.

## Highlights

- Access to the full power of Orbit and its ecosystem, including compatible
  sources, buckets, and coordination strategies.

- A data schema that's declared through simple model definitions.

- Stores that wrap Orbit sources and provide access to their underlying data as
  easy to use records and record arrays. These stores can be forked, edited in
  isolation, and merged back to the original as a coalesced changeset.

- Live-updating filtered query results and model relationships.

- The full power of Orbit's composable query expressions.

- The ability to connect any number of sources together with Orbit coordination
  strategies.

- Orbit's git-like deterministic change tracking and history manipulation
  capabilities.

## Relationship to Orbit

EO provides a thin "Emberified" layer over the top of some core
primitives from Orbit, including `Store`, `Cache`, and `Model` classes. Most
common developer interactions with Orbit will be through these classes.

EO does not attempt to wrap _every_ base class from Orbit. For instance, you'll
need to use Orbit's `Coordinator` and coordination strategies to define
relationships between Orbit sources. In this way, you can install any Orbit
`Source` or `Bucket` library and wire them together in your EO application.

> **Important**: It's strongly recommended that you read the Orbit guides at
> [orbitjs.com](https://orbitjs.com) before using EO, since an understanding of
> Orbit is vital to making the most of EO.

## Compatibility

- Ember.js v3.28 or above
- Ember CLI v3.28 or above
- Node.js v20 or above

## Status

EO obeys [semver](http://semver.org) and thus should not be considered to have a
stable API until 1.0. Until then, any breaking changes in APIs or Orbit
dependencies should be accompanied by a minor version bump of EO.

## Demo

[todomvc-ember-orbit](https://github.com/orbitjs/todomvc-ember-orbit) is a
simple TodoMVC example that uses EO to illustrate a number of possible
configurations and application patterns.

## Installation

Install EO in your project with:

```
ember install ember-orbit
```

The generators for orbit sources and buckets will attempt to install any
additional orbit-related dependencies.

## Usage

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

All the directories and services configured by EO can be customized for your
app, as described in the "Customizing EO" section below.

### Defining models

Models are used to access the underlying data in an EO `Store`.
They provide a proxy to get and set attributes and relationships. In addition,
models are used to define the schema that's shared by the sources in your
Orbit application.

The easiest way to create a `Model` class is with the `data-model` generator:

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
  @key() remoteId;
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

### Stores and Caches

EO's `Store` class is a thin wrapper around Orbit's
[`MemorySource`](https://orbitjs.com/docs/api/memory/classes/MemorySource),
while EO's `Cache` class wraps Orbit's
[`MemoryCache`](https://orbitjs.com/docs/api/memory/classes/MemoryCache).
The difference between memory sources and caches is [explained extensively in
Orbit's docs](https://orbitjs.com/docs/memory-sources).

The essential difference between EO's `Store` and `Cache` and the underlying
Orbit classes is that EO is model-aware. Unlike plain Orbit, in which results
are returned as static POJOS, every query and update result in EO is translated
into `Model` instances, or simply "records". When changes occur to the
underlying Orbit sources and caches, they will be reflected immediately in EO's
records.

Every EO record is connected to a cache, which in turn belongs to a store. When
stores or caches provide results in the form of records, they are always
instantiated by, and belong to, a `Cache`. For a given identity (`type` / `id`
pair), there is only ever one record instance per cache. These are maintained in
what is fittingly called an ["identity
map"](https://orbitjs.com/docs/api/identity-map).

Records, including all their attributes and relationships, will stay in sync
with the underlying data in their associated cache.

### Querying Data

There are three primary methods available to query records:

- `store.query()` - returns a promise that resolves to a static recordset.

- `store.cache.query()` - returns a static set of in-memory results immediately.

- `store.cache.liveQuery()` - returns a live recordset that will be refreshed
  whenever the data changes in the cache.

All of these query methods take the same arguments as any other queryable Orbit
source - see [the Orbit guides](https://orbitjs.com/docs/querying-data) for
details.

The following `liveQuery` immediately returns a live resultset that will stay
updated with the "terrestrial" planets in the store:

```javascript
let planets = store.cache.liveQuery((qb) =>
  qb
    .findRecords('planet')
    .filter({ attribute: 'classification', value: 'terrestrial' })
);
```

The EO `Store` also supports `findRecord` and `findRecords` methods. These
methods are async and call `query` internally:

```javascript
// find all records of a type
let planets = await store.findRecords('planet');

// find a specific record by type and id
let planet = await store.findRecord('planet', 'abc123');
```

These methods are also available on the EO `Cache`, but are synchronous:

```javascript
// find all records of a type
let planets = store.cache.findRecords('planet');

// find a specific record by type and id
let planet = store.cache.findRecord('planet', 'abc123');
```

### Updating Data

There are two primary approaches to update data in EO:

- Directly via async methods on the main `Store`. Direct updates flow
  immediately into Orbit's [request
  flow](https://orbitjs.com/docs/data-flows), where they can trigger side
  effects, such as remote server requests.

- In an isolated "forked" `Store`, usually via sync methods on its associated
  `Cache` and/or `Model` instances. These changes remain in this fork until they
  are merged back to a base store.

#### Direct Updates to the Store

The `Store` exposes several async methods to update data:

- `addRecord` - adds a single record.
- `updateRecord` - updates the fields of a single record.
- `updateRecordFields` - for updating the fields of a single record, with a
  first argument that provides the identity of the record.
- `removeRecord` - removes a single record.
- `update` - the most flexible and powerful method, which can perform one or
  more operations in a single request.

Here are some examples of each:

```javascript
// add a new record (returned as a Model instance)
let planet = await store.addRecord({ type: 'planet', id: '1', name: 'Earth' });
console.log(planet.name); // Earth

// update one or more fields of the record
await store.updateRecord({ type: 'planet', id: '1', name: 'Mother Earth' });
console.log(planet.name); // Mother Earth

// remove the record
await store.removeRecord({ type: 'planet', id: '1' });
// or alternatively: await store.removeRecord(planet);

// add more planets in a single `Transform`
let [mars, venus] = await store.update((t) => [
  t.addRecord({ type: 'planet', name: 'Mars' }),
  t.addRecord({ type: 'planet', name: 'Venus' })
]);
```

#### Updates via Forking / Merging

EO stores can be forked and merged, just as described in the [Orbit
guides](https://orbitjs.com/docs/memory-sources#forking-memory-sources).

Once you have forked a store, you can proceed to make synchronous changes to the
fork's associated `Cache` and/or `Model` instances. These changes will be
tracked and can then be merged back to the base store.

Here's an example:

```javascript
  // (async) start by adding two planets and a moon to the store
  await store.update(t => [
    t.addRecord(earth),
    t.addRecord(venus),
    t.addRecord(theMoon)
  ]);

  // (async) query the planets in the store
  let planets = await store.query(q => q.findRecords('planet').sort('name')));
  console.log('original planets', planets);

  // (sync) fork the store
  forkedStore = store.fork();
  let forkedCache = forkedStore.cache;

  // (sync) add a planet and moons to the fork's cache
  forkedCache.update(t => [
    t.addRecord(jupiter),
    t.addRecord(io),
    t.addRecord(europa)
  ]);

  // (sync) query the planets in the forked cache
  planets = forkedCache.query(q => q.findRecords('planet').sort('name')));
  console.log('planets in fork', planets);

  // (async) merge the forked store back into the original store
  await store.merge(forkedStore);

  // (async) query the planets in the original store
  planets = await store.query(q => q.findRecords('planet').sort('name')));
  console.log('merged planets', planets);
```

Some notes about forking / merging:

- Once a store has been forked, the original and forked stores’ data can diverge
  independently.

- Merging a fork will coalesce any changes made to the forked cache into a
  single new transform, and then update the original store.

- A store fork can simply be abandoned without cost. Just remember to free any
  references to the JS objects themselves.

> **Important** - One additional concern to be aware of is that EO will generate
> new records for each store. Care should be taken to not mix records between
> stores, since the underlying data in each store can diverge. If you need to
> access a record in a store's fork, just query the forked store or cache for
> that record.

#### Sync Updates via the Cache

The `Cache` exposes sync versions of the `Store`'s async update methods:

- `addRecord` - for adding a single record.
- `updateRecord` - for updating the fields of a single record.
- `removeRecord` - for removing a single record.
- `update` - the most flexible and powerful method, which can perform one or
  more operations in a single request.

By default, only forked caches are able to be updated directly. This provides
protection against data loss, since changes to caches do not participate in
Orbit's [data flows](https://orbitjs.com/docs/data-flows). An exception is
made for forks because the changes are tracked and applied back to stores via
`merge`.

If you want to override these protections and update a non-forked cache, you can
set `cache.allowUpdates = true`, but know that those updates won't leave the
cache.

#### Sync Updates via Model instances

Each `Model` exposes all of its fields, including attributes and relationships,
as properties that stay updated.

Attributes and has-one relationships are also directly editable. For instance:

```javascript
let jupiter = forkedCache.findRecord('planet', 'jupiter');
let sun = forkedCache.findRecord('star', 'theSun');

console.log(jupiter.name); // 'Jupiter'

// update attribute
jupiter.name = 'Jupiter!';
console.log(jupiter.name); // 'Jupiter!'

// update has-one relationship
jupiter.sun = theSun;
```

In order to not conflict with user-defined fields, all standard methods on
`Model` are prefixed with a `$`. The following synchronous methods are
available:

- `$replaceAttribute`
- `$replaceRelatedRecord`
- `$replaceRelatedRecords`
- `$addToRelatedRecords`
- `$removeFromRelatedRecords`
- `$update`
- `$remove`

```javascript
let jupiter = forkedCache.findRecord('planet', 'jupiter');
let io = forkedCache.findRecord('moon', 'io');
let europa = forkedCache.findRecord('moon', 'europa');
let sun = forkedCache.findRecord('star', 'theSun');

jupiter.$replaceAttribute('name', 'JUPITER!');
jupiter.$addToRelatedRecords('moons', io);
jupiter.$removeFromRelatedRecords('moons', europa);
jupiter.$replaceRelatedRecord('sun', sun);

console.log(jupiter.name); // 'JUPITER!'
console.log(jupiter.moons.includes(io)); // true
console.log(jupiter.moons.includes(europa)); // false
console.log(jupiter.sun.id); // 'theSun'
```

Behind the scenes, these changes each result in a call to `forkedCache.update`.
Of course, this method could also be called directly instead of issuing updates
through the model:

```javascript
forkedCache.update((t) => [
  t.replaceAttribute(jupiter, 'name', 'JUPITER!');
  t.addToRelatedRecords(jupiter, 'moons', io);
  t.removeFromRelatedRecords(jupiter, 'moons', europa);
  t.replaceRelatedRecord(jupiter, 'sun', sun);
]);
```

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
import { applyStandardSourceInjections } from 'ember-orbit';

export default {
  create(injections = {}) {
    applyStandardSourceInjections(injections);
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
  @service store;

  async beforeModel() {
    // Populate the store from backup prior to activating the coordinator
    const backup = this.dataCoordinator.getSource('backup');
    const records = await backup.query((q) => q.findRecords());
    await this.store.sync((t) => records.map((r) => t.addRecord(r)));

    await this.dataCoordinator.activate();
  }
}
```

This code first pulls all the records from backup and then syncs them
with the main store _before_ activating the coordinator. In this way, the
coordination strategy that backs up the store won't be enabled until after
the restore is complete.

### Defining a data bucket

Data buckets are used by sources and key maps to load and persist state. You
will probably want to use a bucket if you plan to support any offline or
optimistic UX.

To create a new bucket, run the generator:

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
module.exports = function (environment) {
  let ENV = {
    // ... other settings here

    // Default Orbit settings (any of which can be overridden)
    orbit: {
      schemaVersion: undefined,
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
        bucket: 'data-bucket',
        coordinator: 'data-coordinator',
        schema: 'data-schema',
        keyMap: 'data-key-map',
        normalizer: 'data-normalizer',
        validator: 'data-validator'
      },
      skipStoreService: false,
      skipBucketService: false,
      skipCoordinatorService: false,
      skipSchemaService: false,
      skipKeyMapService: false,
      skipNormalizerService: false,
      skipValidatorService: false
    }
  };

  return ENV;
};
```

Note that `schemaVersion` should be set if you're using any Orbit sources, such
as `IndexedDBSource`, that track schema version. By default, Orbit's schema
version will start at `1`. This value should be bumped to a a higher number with
each significant change that requires a schema migration. Migrations themselves
must be handled in each individual source.

### Conditionally include strategies and sources

Sources and strategies may be conditionally included in your app's coordinator
by customizing the default export of the source / strategy factory. A valid
factory is an object with the interface `{ create: () => {} }`. If a valid
factory is not the default export for your module, it will be ignored.

For example, the following strategy will be conditionally included for all
non-production builds:

```js
// app/data-strategies/event-logging.js

import { EventLoggingStrategy } from '@orbit/coordinator';
import config from 'example/config/environment';

const factory = {
  create() {
    return new EventLoggingStrategy();
  }
};

// Conditionally include this strategy
export default config.environment !== 'production' ? factory : null;
```

#### Customizing validators

Like Orbit itself, EO enables validators by default in all sources. EO provides
the same set of validators to all sources by building a single `data-validator`
service that is injected into all sources.

Validators are useful to ensure that your data matches its type expectations and
that operations and query expressions are well formed. Of course, they also add
some extra code and processing, which you may want to eliminate (or perhaps only
for production environments). You can disable validators across all sources by
setting Orbit's `skipValidatorService` environment flag to `false` in
`config/environment`, as described above.

If you want to use validators but extend them to include custom validators, you
can override the standard validator service by generating your own
`data-validator` service that passes custom arguments to
[`buildRecordValidatorFor`](https://orbitjs.com/docs/api/records/modules#buildrecordvalidatorfor).

For instance, in order to provide a custom validator for an `address` type:

```js
// app/services/data-validator.js

import { buildRecordValidatorFor } from '@orbit/records';

const validators = {
  address: (input) => {
    if (typeof input?.country !== 'string') {
      return [
        {
          validator: 'address',
          validation: 'country',
          description: 'is not a string',
          ref: input,
        },
      ];
    }
  },
};

export default {
  create() {
    return buildRecordValidatorFor({ validators });
  },
};
```

This custom validator service will be injected into all your orbit sources via
`applyStandardSourceInjections`, as described above.

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

## License

Copyright 2014-2021 Cerebris Corporation. MIT License (see LICENSE for details).
