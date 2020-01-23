# Forking and merging stores

Because EO stores and caches are just thin wrappers over their
underlying Orbit equivalents, they share the same basic capabilities.
Thus, EO stores can be forked and merged, just as described in the
[Orbit guides](http://orbitjs.com/v0.15/guide/data-stores.html#Forking-stores).

The same example can be followed:

```javascript
  // start by adding two planets and a moon to the store
  await store.update(t => [
    t.addRecord(earth),
    t.addRecord(venus),
    t.addRecord(theMoon)
  ]);

  let planets = await store.query(q => q.findRecords('planet').sort('name')));
  console.log('original planets');
  console.log(planets);

  // fork the store
  forkedStore = store.fork();

  // add a planet and moons to the fork
  await forkedStore.update(t => [
    t.addRecord(jupiter),
    t.addRecord(io),
    t.addRecord(europa)
  ]);

  // query the planets in the forked store
  planets = await forkedStore.query(q => q.findRecords('planet').sort('name')));
  console.log('planets in fork');
  console.log(planets);

  // merge the forked store back into the original store
  await store.merge(forkedStore);

  // query the planets in the original store
  planets = await store.query(q => q.findRecords('planet').sort('name')));
  console.log('merged planets');
  console.log(planets);
```

And the same notes apply:

- Once a store has been forked, the original and forked stores’ data can diverge
  independently.

- A store fork can simply be abandoned without cost.

- Merging a fork will gather the transforms applied since the fork point,
  coalesce the operations in those transforms into a single new transform, and
  then update the original store.

> **Important** - One additional concern to be aware of is that EO will
> generate new records for each store. Care should be taken to not mix records
> between stores, since the underlying data in each store can diverge. If you need
> to access a record in a store's fork, just query the forked store or cache for
> that record.