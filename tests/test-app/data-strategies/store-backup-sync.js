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
      // filter(...args) {},

      /**
       * Should resolution of the target's `sync` block the completion of the
       * source's `transform`?
       *
       * Can be specified as a boolean or a function which which will be
       * invoked in the context of this strategy (and thus will have access to
       * both `this.source` and `this.target`).
       */
      blocking: true,
    });
  },
};
