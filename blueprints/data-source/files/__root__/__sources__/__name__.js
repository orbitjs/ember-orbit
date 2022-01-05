import SourceClass from '<%= from %>';
import { applyStandardSourceInjections } from 'ember-orbit';

export default {
  create(injections = {}) {
    applyStandardSourceInjections(injections);
    injections.name = '<%= dasherizedModuleName %>';
    return new SourceClass(injections);
  }
};
