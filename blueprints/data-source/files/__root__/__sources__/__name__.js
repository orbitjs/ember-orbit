import SourceClass from '<%= from %>';

export default {
  create(injections = {}) {
    injections.name = '<%= dasherizedModuleName %>';
    return new SourceClass(injections);
  }
};
