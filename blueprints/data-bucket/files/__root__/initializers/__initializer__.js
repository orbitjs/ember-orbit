import BucketFactory from '../<%= bucketsCollection %>/<%= dasherizedModuleName %>';

export function initialize(application) {
  const config = application.resolveRegistration('ember-orbit:config') || {};

  const bucketService = '<%= serviceName %>';

  // Register bucket service
  application.register(`service:${bucketService}`, BucketFactory);

  // Inject bucket into all sources
  application.inject(config.types.source, 'bucket', `service:${bucketService}`);

  // Inject bucket into keyMap (if one is present)
  if (!config.skipKeyMap) {
    application.inject(
      `service:${config.services.keyMap}`,
      'bucket',
      `service:${bucketService}`
    );
  }
}

export default {
  name: '<%= initializerName %>',
  after: 'ember-orbit-config',
  initialize
};
