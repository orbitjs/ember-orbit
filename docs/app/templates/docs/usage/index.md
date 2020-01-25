# Using EO

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