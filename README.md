# Ember-Orbit [![Build Status](https://secure.travis-ci.org/orbitjs/ember-orbit.png?branch=master)](http://travis-ci.org/orbitjs/ember-orbit) [![Join the chat at https://gitter.im/orbitjs/orbit.js](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/orbitjs/orbit.js?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Ember-Orbit is a library that integrates
[Orbit.js](https://github.com/orbitjs/orbit) with
[Ember.js](https://github.com/emberjs/ember.js) to provide flexibility and
control in your application's data layer.

Ember-Orbit features:

* Access to the full power of Orbit and its ecosystem, including compatible
  sources, buckets, and coordination strategies.

* A data schema that's declared through simple model definitions.

* Stores that wrap Orbit sources and provide access to their underlying data as
  easy to use records and record arrays.

* Stores that can be forked, edited in isolation, and merged back to the
  original as a coalesced changeset.

* Live-updating filtered record arrays and model relationships.

* The full power of Orbit's composable query expressions.

* The ability to connect any number of sources together with Orbit coordination
  strategies.

* Git-like deterministic change tracking and history manipulation.

## Relationship to Orbit

Ember-Orbit provides a very thin "Emberified" layer over the top of some core
primitives from Orbit, including `Store`, `Cache`, and `Model` classes that
extend `Ember.Object`. Most common developer interactions with Orbit will be
through these classes.

However, Ember-Orbit does not attempt to wrap _every_ base class from Orbit.
For instance, you'll need to use Orbit's `Coordinator` and coordination
strategies to define relationships between Orbit sources. In this way, you can
install any Orbit `Source` or `Bucket` library and wire them together in your
Ember-Orbit application.

## Status

Ember-Orbit has matured quite a bit between 0.8 and 0.9. However, since it has
not reached 1.0, we make no guarantees about interface stability. Please use
with caution.

## Installation

As with any Ember addon, you can install Ember-Orbit in your project with:

```
ember install ember-orbit
```

Ember-Orbit itself already has several Orbit dependencies, including
`@orbit/core`, `@orbit/coordinator`, `@orbit/data`, `@orbit/store`, and
`@orbit/utils`.

If you want to use additional Orbit sources and buckets, install them as
regular dependencies. For example:

```
npm install @orbit/jsonapi --save
```

You'll also need to tell Ember-Orbit to include these packages in your build.
Modify your `ember-cli-build.js` file to add them to an `orbit.packages` array
like this:

```
const EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = function(defaults) {
  const app = new EmberApp(defaults, {
    // Orbit-specific options
    orbit: {
      packages: [
        '@orbit/jsonapi',
        '@orbit/indexeddb',
        '@orbit/local-storage',
        '@orbit/indexeddb-bucket',
        '@orbit/local-storage-bucket'
      ]
    }
  });

  return app.toTree();
};
```

Note: There's nothing particularly Orbit-specific about the implementation
that imports these packages. Expect this solution to be generalized in the near
future.

## Using Ember-Orbit

Ember-Orbit installs the following services by default:

* `data-schema` - An `@orbit/data` `Schema` instance that should be shared by
  all the Orbit sources in your application.

* `data-coordinator` - An `@orbit/coordinator` `Coordinator` instance that
  manages the sources and coordination strategies between them.

* `data-key-map` - An `@orbit/data` `KeyMap` instance that contains mappings
  between local IDs and remote keys (if UUIDs aren't used throughout).

* `store` - An Ember-Orbit `Store` instance.

Out-of-the box, you can begin developing using `store` service, which is
injected into every route and controller.

However, the store's contents exist only in memory and will be cleared every
time your app restarts. Let's try adding another source and use the
`dataCoordinator` service to keep it in sync with the store.

### Adding an IndexedDB source

Configuration of coordination strategies can be done in either an
instance initializer or the application route. This process is rather manual
now, but will be simplified in future versions.

_Coming soon! For now please reference the peeps-ember-orbit example app._

## Contributing

### Installation

* `git clone https://github.com/orbitjs/ember-orbit.git`
* `cd ember-orbit`
* `npm install`

### Running

* `ember serve`
* Visit your app at [http://localhost:4200](http://localhost:4200).

### Running Tests

* `npm test` (Runs `ember try:each` to test your addon against multiple Ember versions)
* `ember test`
* `ember test --server`

### Building

* `ember build`

For more information on using ember-cli, visit [https://ember-cli.com/](https://ember-cli.com/).

## Acknowledgments

Ember-Orbit owes a great deal to [Ember Data](https://github.com/emberjs/data),
which has influenced the design of many of Ember-Orbit's interfaces. Many thanks
to the Ember Data Core Team, including Yehuda Katz, Tom Dale, and Igor Terzic,
for their work.

It is hoped that, by tracking Ember Data's features and interfaces where
possible, Ember-Orbit will also be able to contribute back to Ember Data.


## License

Copyright 2014-2017 Cerebris Corporation. MIT License (see LICENSE for details).
