# Ember-Orbit

Ember-Orbit is a library that integrates
[Orbit.js](https://github.com/orbitjs/orbit.js) with
[Ember.js](https://github.com/emberjs/ember.js).


## Status

Ember-Orbit is undergoing heavy development. Interfaces may change, so please
use with caution.


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

## Acknowledgments

Ember-Orbit owes a great deal to [Ember Data](https://github.com/emberjs/data),
not only for the design of several interfaces but also for the base code used to
manage record arrays.

It is hoped that, by tracking Ember Data's features and interfaces where
possible, Ember Orbit will also be able to contribute back to Ember Data.

## License

Copyright 2014 Cerebris Corporation. MIT License (see LICENSE for details).
