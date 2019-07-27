<% if (type === 'log-truncation') { %>
import { LogTruncationStrategy } from '@orbit/coordinator';

export default {
  create() {
    return new LogTruncationStrategy();
  }
};
<% } else if (type === 'event-logging') { %>
import { EventLoggingStrategy } from '@orbit/coordinator';

export default {
  create() {
    return new EventLoggingStrategy();
  }
};
<% } else if (type === 'sync') { %>
import { SyncStrategy } from '@orbit/coordinator';

export default {
  create() {
    return new SyncStrategy({
      name: '<%= dasherizedModuleName %>',

      /**
       * The name of the source which will have its `transform` event observed.
       */
      source: '<%= source %>',

      /**
       * The name of the source which will be acted upon.
       *
       * When the source receives the `transform` event, the `sync` method
       * will be invoked on the target.
       */
      target: '<%= target %>',

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
<% } else if (type === 'request') { %>
import { RequestStrategy } from '@orbit/coordinator';

export default {
  create() {
    return new RequestStrategy({
      name: '<%= dasherizedModuleName %>',

      /**
       * The name of the source to be observed.
       */
      source: '<%= source %>',

      /**
       * The name of the event to observe (e.g. `beforeQuery`, `query`,
       * `beforeUpdate`, `update`, etc.).
       */
      on: '<%= on %>',

      /**
       * The name of the source which will be acted upon.
       */
      target: '<%= target %>',

      /**
       * The action to perform on the target.
       *
       * Can be specified as a string (e.g. `pull`) or a function which will be
       * invoked in the context of this strategy (and thus will have access to
       * both `this.source` and `this.target`).
       */
      action: '<%= action %>',

      /**
       * A handler for any errors thrown as a result of performing the action.
       */
      // catch(e) {},

      /**
       * A filter function that returns `true` if the `action` should be performed.
       *
       * `filter` will be invoked in the context of this strategy (and thus will
       * have access to both `this.source` and `this.target`).
       */
      // filter(...args) {};

      /**
       * Should results returned from calling `action` on the `target` source be
       * passed as hint data back to the `source`?
       *
       * This can allow hints to inform the processing of subsequent actions on the
       * source. For instance, a `beforeQuery` event might invoke `query` on a
       * target, and those results could inform how the originating source performs
       * `_query`. This might allow a target source's sorting and filtering of
       * results to affect how the originating source processes the query.
       *
       * This setting is only effective for `blocking` strategies, since only in
       * those scenarios is processing delayed.
       */
      passHints: true,

      /**
       * Should resolution of the target's `action` invocation block the
       * completion of the source's `on` event?
       *
       * Can be specified as a boolean or a function which which will be
       * invoked in the context of this strategy (and thus will have access to
       * both `this.source` and `this.target`).
       */
      blocking: true
    });
  }
};
<% } %>
