import BucketFactory from '../<%= bucketsCollection %>/<%= dasherizedModuleName %>';

export function initialize(application) {
  const orbitConfig = application.resolveRegistration('ember-orbit:config');

  // Register this bucket as the main bucket service so that it can be injected
  // into sources via `applyStandardSourceInjections`.
  //
  // IMPORTANT: If your app has more than one bucket, only register one as the
  // main bucket service.
  application.register(`service:${orbitConfig.services.bucket}`, BucketFactory);
}

export default {
  name: '<%= initializerName %>',
  after: 'ember-orbit-config',
  initialize
};
