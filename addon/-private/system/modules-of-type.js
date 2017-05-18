/**
 * Retrieves modules registered by type in the namespace of an Application or
 * Engine.
 *
 * This resolution process is inefficient and should be revisited when more
 * discovery capabilities are added to the ember-resolver.
 */
export default function(prefix, type) {
  const regex = new RegExp('^' + prefix + '\/' + type + '\/?\/');
  const moduleNames = Object.keys(self.requirejs._eak_seen);
  const found = [];

  moduleNames.forEach(moduleName => {
    var matches = regex.exec(moduleName);
    if (matches && matches.length === 1) {
      let name = moduleName.match(/[^\/]+\/?$/)[0];
      found.push(name);
    }
  });

  return found;
}
