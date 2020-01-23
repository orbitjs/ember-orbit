# ember-orbit [![Build Status](https://secure.travis-ci.org/orbitjs/ember-orbit.png?branch=master)](http://travis-ci.org/orbitjs/ember-orbit) [![Join the chat at https://gitter.im/orbitjs/orbit.js](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/orbitjs/orbit.js?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

`ember-orbit` (or "EO") is a library that integrates
[orbit.js](https://github.com/orbitjs/orbit) with
[ember.js](https://github.com/emberjs/ember.js) to provide flexibility and
control in your application's data layer.

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