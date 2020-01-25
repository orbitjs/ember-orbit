import AddonDocsRouter, { docsRoute } from 'ember-cli-addon-docs/router';
import config from './config/environment';

const Router = AddonDocsRouter.extend({
  location: config.locationType,
  rootURL: config.rootURL
});

Router.map(function() {
  docsRoute(this, function() {
    this.route('configuration');
    this.route('installation');
    this.route('usage', function() {
      this.route('activating-coordinator');
      this.route('adding-records');
      this.route('backup-source');
      this.route('coordination-strategies');
      this.route('data-bucket');
      this.route('defining-models');
      this.route('forking-and-merging');
      this.route('querying-records');
      this.route('updating-records');
    });
  });
  this.route('not-found', { path: '/*path' });
});

export default Router;
