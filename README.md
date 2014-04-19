# Ember-Orbit


## Schema

* has an OC.Schema


## Store

* has a Schema
* has 1..n Contexts


## Source

* has an OC.Source


## Context

* extends Source
* belongs to a Store
* has 0..n Model instances in a memory map


## Model

* belongs to a Context
* PromiseProxyMixin

## Transaction

* belongs to a Context


## License

Copyright 2014 Cerebris Corporation. MIT License (see LICENSE for details).

