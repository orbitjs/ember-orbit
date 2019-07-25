import BucketClass from '<%= from %>';

export default {
  create(injections = {}) {
    injections.name = '<%= dasherizedModuleName %>';
    injections.namespace =
      '<%= namespace || `${dasherizedPackageName}-${dasherizedModuleName}` %>';
    return new BucketClass(injections);
  }
};
