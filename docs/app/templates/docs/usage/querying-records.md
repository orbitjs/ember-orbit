# Querying records

There are three unique methods used to query records:

- `store.query()` - returns a promise that resolves to a static recordset.

- `store.liveQuery()` - returns a promise that resolves to a live recordset that
  will be refreshed whenever the store's data changes.

- `store.cache.query()` - returns a static set of in-memory results immediately.

All of these query methods take the same arguments as any other queryable
Orbit source - see
[the Orbit guides](http://orbitjs.com/v0.15/guide/querying-data.html) for
details.

For example, the following `liveQuery` should return a promise that resolves
to a live resultset that will stay updated with the "terrestrial" planets in
the store:

```javascript
let planets = await store.liveQuery(qb =>
  qb
    .findRecords('planet')
    .filter({ attribute: 'classification', value: 'terrestrial' })
);
```

Unlike the Orbit `Store`, in which results are returned as static POJOs,
results from EO queries are returned as records, i.e. instantiated
versions of their associated `Model` class.

The attributes and relationships of records will be kept in sync with the
backing store.

Note that the EO `Store` also supports the `find` method for
compatibility with Ember's default expectations in routes. The following
queries are async and call `store.query` internally:

```javascript
// find all records of a type
store.find('planet');

// find a specific record by type and id
store.find('planet', 'abc123');
```

The following queries are synchronous and call `store.cache.query` internally:

```javascript
// find all records of a type
store.cache.find('planet');

// find a specific record by type and id
store.cache.find('planet', 'abc123');