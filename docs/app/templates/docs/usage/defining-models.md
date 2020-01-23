# Defining models

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
