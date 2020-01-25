# Defining coordination strategies

There are four different types of coordination strategies that can be generated
by default using the standard `data-strategy` generator:

- `request`
- `sync`
- `event-logging`
- `log-truncation`

Let's define a sync strategy to backup changes made to the store into our new
`backup` source.

```
ember g data-strategy store-backup-sync --type=sync
```

This should create a `SyncStrategy` factory in
`app/data-strategies/store-backup-sync.js` as follows:

```js
import { SyncStrategy } from '@orbit/coordinator';

export default {
  create() {
    return new SyncStrategy({
      name: 'store-backup-sync',

      /**
       * The name of the source which will have its `transform` event observed.
       */
      source: 'store',

      /**
       * The name of the source which will be acted upon.
       *
       * When the source receives the `transform` event, the `sync` method
       * will be invoked on the target.
       */
      target: 'backup',

      /**
       * A handler for any errors thrown as a result of invoking `sync` on the
       * target.
       */
      // catch(e) {},

      /**
       * A filter function that returns `true` if `sync` should be performed.
       *
       * `filter` will be invoked in the context of this strategy (and thus will
       * have access to both `this.source` and `this.target`).
       */
      // filter(...args) {};

      /**
       * Should resolution of the target's `sync` block the completion of the
       * source's `transform`?
       *
       * Can be specified as a boolean or a function which which will be
       * invoked in the context of this strategy (and thus will have access to
       * both `this.source` and `this.target`).
       */
      blocking: true
    });
  }
};
```

You should also consider adding an event logging strategy to log events emitted
from your sources to the browser console:

```
ember g data-strategy event-logging
```

Sources have another kind of log as well: a transform log, which tracks
transforms that are applied. A log truncation strategy will keep the size of
transform logs in check. It observes the sources associated with the strategy
and truncates their transform logs when a common transform has been applied
to them all. Let's add a log truncation strategy as well:

```
ember g data-strategy log-truncation
```
