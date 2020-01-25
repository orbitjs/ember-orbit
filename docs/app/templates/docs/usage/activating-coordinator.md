# Activating the coordinator

Next we'll need to activate our coordinator as part of our app's boot process.
The coordinator requires an explicit activation step because the process is
async _and_ we may want to allow developers to do work beforehand.

In our case, we want to restore our store from the backup source before we
enable the coordinator. Let's do this in our application route's `beforeModel`
hook (in `app/routes/application.js`):

```js
import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default class ApplicationRoute extends Route {
  @service dataCoordinator;

  async beforeModel() {
    // Populate the store from backup prior to activating the coordinator
    const backup = this.dataCoordinator.getSource('backup');
    const transform = await backup.pull(q => q.findRecords());
    await this.store.sync(transform);

    await this.dataCoordinator.activate();
  }
}
```

This code first pulls all the records from backup and then syncs them
with the main store _before_ activating the coordinator. In this way, the
coordination strategy that backs up the store won't be enabled until after
the restore is complete.