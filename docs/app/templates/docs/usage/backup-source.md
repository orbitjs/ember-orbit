# Adding a "backup" source

The store's contents exist only in memory and will be cleared every time your
app restarts. Let's try adding another source and use the `dataCoordinator`
service to keep it in sync with the store.

We can use the `data-source` generator to create a `backup` source:

```
ember g data-source backup --from=@orbit/indexeddb
```

This will generate a source factory in `app/data-sources/backup.js`:

```javascript
import SourceClass from '@orbit/indexeddb';

export default {
  create(injections = {}) {
    injections.name = 'backup';
    return new SourceClass(injections);
  }
};
```

Note that `injections` should include both a `Schema` and a `KeyMap`, which
are injected by default for every EO application. We're also adding
a `name` to uniquely identify the source within the coordinator. You could
optionally specify a `namespace` to be used to name the IndexedDB database.

Every source that's defined in `app/data-sources` will be discovered
automatically by EO and added to the `dataCoordinator` service.

Next let's define some strategies to synchronize data between sources.