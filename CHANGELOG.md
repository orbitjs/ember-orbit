# Changelog

## v0.16.5 (2020-01-14)

#### :rocket: Enhancement

- [#239](https://github.com/orbitjs/ember-orbit/pull/239) Fix store#merge return type ([@tchak](https://github.com/tchak))

#### :memo: Documentation

- [#239](https://github.com/orbitjs/ember-orbit/pull/239) Fix store#merge return type ([@tchak](https://github.com/tchak))

#### :house: Internal

- [#246](https://github.com/orbitjs/ember-orbit/pull/246) Test with node 10 ([@dgeb](https://github.com/dgeb))
- [#245](https://github.com/orbitjs/ember-orbit/pull/245) Add more LTS builds ([@tchak](https://github.com/tchak))

#### Committers: 2

- Dan Gebhardt ([@dgeb](https://github.com/dgeb))
- Paul Chavard ([@tchak](https://github.com/tchak))

## v0.16.4 (2019-12-22)

#### :rocket: Enhancement

- [#236](https://github.com/orbitjs/ember-orbit/pull/236) Upgrade ember, orbit.js and other dependencies ([@tchak](https://github.com/tchak))

#### :bug: Bug Fix

- [#234](https://github.com/orbitjs/ember-orbit/pull/234) Allow ember-orbit to be used in addons ([@devotox](https://github.com/devotox))
- [#235](https://github.com/orbitjs/ember-orbit/pull/235) Fix app reference in addon index ([@tchak](https://github.com/tchak))

#### :house: Internal

- [#237](https://github.com/orbitjs/ember-orbit/pull/237) Explicitly declare supported node versions ([@tchak](https://github.com/tchak))

#### Committers: 2

- Devonte ([@devotox](https://github.com/devotox))
- Paul Chavard ([@tchak](https://github.com/tchak))

## v0.16.3 (2019-09-26)

#### :rocket: Enhancement

- [#229](https://github.com/orbitjs/ember-orbit/pull/229) Upgrade dependencies ([@dgeb](https://github.com/dgeb))

#### Committers: 1

- Dan Gebhardt ([@dgeb](https://github.com/dgeb))

## v0.16.2 (2019-09-05)

#### :bug: Bug Fix

- [#218](https://github.com/orbitjs/ember-orbit/pull/218) Upgrade @orbit/coordinator@^0.16.2 ([@dgeb](https://github.com/dgeb))

#### Committers: 1

- Dan Gebhardt ([@dgeb](https://github.com/dgeb))

## v0.16.1 (2019-08-20)

#### :bug: Bug Fix

- [#215](https://github.com/orbitjs/ember-orbit/pull/215) Fix in 3.11+ ([@cibernox](https://github.com/cibernox))

#### :house: Internal

- [#216](https://github.com/orbitjs/ember-orbit/pull/216) Bump @orbit deps ([@dgeb](https://github.com/dgeb))
- [#214](https://github.com/orbitjs/ember-orbit/pull/214) Update to Ember 3.12 ([@cibernox](https://github.com/cibernox))

#### Committers: 2

- Dan Gebhardt ([@dgeb](https://github.com/dgeb))
- Miguel Camba ([@cibernox](https://github.com/cibernox))

## v0.16.0 (2019-07-30)

#### :rocket: Enhancement

- [#210](https://github.com/orbitjs/ember-orbit/pull/210) Refine strategy generator ([@dgeb](https://github.com/dgeb))
- [#207](https://github.com/orbitjs/ember-orbit/pull/207) Make strategy name parsing even smarter ([@dgeb](https://github.com/dgeb))
- [#206](https://github.com/orbitjs/ember-orbit/pull/206) Create data-buckets dir in default blueprint ([@dgeb](https://github.com/dgeb))
- [#205](https://github.com/orbitjs/ember-orbit/pull/205) Refactor initializers and data-bucket generator ([@dgeb](https://github.com/dgeb))
- [#204](https://github.com/orbitjs/ember-orbit/pull/204) Introduce `data-bucket` blueprint ([@dgeb](https://github.com/dgeb))
- [#203](https://github.com/orbitjs/ember-orbit/pull/203) Add blueprints ([@dgeb](https://github.com/dgeb))

#### :memo: Documentation

- [#208](https://github.com/orbitjs/ember-orbit/pull/208) Update README ([@dgeb](https://github.com/dgeb))

#### :house: Internal

- [#211](https://github.com/orbitjs/ember-orbit/pull/211) Upgrade orbit packages to v0.16 ([@dgeb](https://github.com/dgeb))
- [#209](https://github.com/orbitjs/ember-orbit/pull/209) Remove unused Promise extension from tests ([@dgeb](https://github.com/dgeb))

#### Committers: 1

- Dan Gebhardt ([@dgeb](https://github.com/dgeb))

## v0.16.0-beta.2 (2019-07-22)

#### :bug: Bug Fix

- [#201](https://github.com/orbitjs/ember-orbit/pull/201) Fix ReadOnlyArrayProxy for octane ([@dgeb](https://github.com/dgeb))

#### Committers: 1

- Dan Gebhardt ([@dgeb](https://github.com/dgeb))

## v0.16.0-beta.1 (2019-07-20)

#### :rocket: Enhancement

- [#197](https://github.com/orbitjs/ember-orbit/pull/197) Modernize and standardize Store + Cache interfaces ([@dgeb](https://github.com/dgeb))
- [#194](https://github.com/orbitjs/ember-orbit/pull/194) Validate presence of models collection ([@tchak](https://github.com/tchak))
- [#193](https://github.com/orbitjs/ember-orbit/pull/193) Use ember-inflector for Orbit Schema singularize/pluralize ([@mattmcmanus](https://github.com/mattmcmanus))
- [#183](https://github.com/orbitjs/ember-orbit/pull/183) Convert to Typescript (part 1) ([@tchak](https://github.com/tchak))
- [#182](https://github.com/orbitjs/ember-orbit/pull/182) Use new obit config to lookup sources and strategies ([@tchak](https://github.com/tchak))
- [#177](https://github.com/orbitjs/ember-orbit/pull/177) [BREAKING] Configurable lookup paths; change default for models (`models/` -> `data-models/`) ([@lukemelia](https://github.com/lukemelia))
- [#180](https://github.com/orbitjs/ember-orbit/pull/180) Provide convenient access to underlying record data via ember-orbit model ([@lukemelia](https://github.com/lukemelia))

#### :bug: Bug Fix

- [#185](https://github.com/orbitjs/ember-orbit/pull/185) Fix management of HasMany relationships ([@dgeb](https://github.com/dgeb))

#### :house: Internal

- [#200](https://github.com/orbitjs/ember-orbit/pull/200) Disable noImplicitAny flag in tsconfig ([@dgeb](https://github.com/dgeb))
- [#198](https://github.com/orbitjs/ember-orbit/pull/198) Bump dependencies, include ember 3.8 in test matrix ([@dgeb](https://github.com/dgeb))
- [#196](https://github.com/orbitjs/ember-orbit/pull/196) Update @orbit dependencies ([@dgeb](https://github.com/dgeb))
- [#195](https://github.com/orbitjs/ember-orbit/pull/195) Update dependencies ([@tchak](https://github.com/tchak))
- [#191](https://github.com/orbitjs/ember-orbit/pull/191) Enable prettier ([@tchak](https://github.com/tchak))
- [#188](https://github.com/orbitjs/ember-orbit/pull/188) Update record ([@tchak](https://github.com/tchak))
- [#190](https://github.com/orbitjs/ember-orbit/pull/190) Update ember-cli ([@tchak](https://github.com/tchak))
- [#189](https://github.com/orbitjs/ember-orbit/pull/189) Update orbit.js ([@tchak](https://github.com/tchak))
- [#187](https://github.com/orbitjs/ember-orbit/pull/187) Upgrade orbit ([@tchak](https://github.com/tchak))
- [#184](https://github.com/orbitjs/ember-orbit/pull/184) Modernize tests ([@dgeb](https://github.com/dgeb))
- [#176](https://github.com/orbitjs/ember-orbit/pull/176) Update orbit dependencies to 0.16.0-beta.1 ([@PieterJanVdb](https://github.com/PieterJanVdb))

#### Committers: 5

- Dan Gebhardt ([@dgeb](https://github.com/dgeb))
- Luke Melia ([@lukemelia](https://github.com/lukemelia))
- Matt McManus ([@mattmcmanus](https://github.com/mattmcmanus))
- Paul Chavard ([@tchak](https://github.com/tchak))
- Pieter-Jan Vandenbussche ([@PieterJanVdb](https://github.com/PieterJanVdb))
