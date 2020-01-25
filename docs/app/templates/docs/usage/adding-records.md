# Adding records

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