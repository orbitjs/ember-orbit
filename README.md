# Ember-Orbit [![Build Status](https://secure.travis-ci.org/orbitjs/ember-orbit.png?branch=master)](http://travis-ci.org/orbitjs/ember-orbit) [![Join the chat at https://gitter.im/orbitjs/orbit.js](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/orbitjs/orbit.js?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

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

TBD - Installation instructions need a full rewrite.


## Using Ember-Orbit

TBD - Usage instructions need a full rewrite.


## Contributing

TBD - Contributing instructions need a full rewrite.


## Acknowledgments

Ember-Orbit owes a great deal to [Ember Data](https://github.com/emberjs/data),
not only for the design of several interfaces but also for the base code used to
manage record arrays. Many thanks to the Ember Data Core Team, including
Yehuda Katz, Tom Dale, and Igor Terzic, for their work.

It is hoped that, by tracking Ember Data's features and interfaces where
possible, Ember Orbit will also be able to contribute back to Ember Data.


## License

Copyright 2014-2016 Cerebris Corporation. MIT License (see LICENSE for details).
