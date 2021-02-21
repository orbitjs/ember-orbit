/* eslint-disable no-useless-escape */
/**
 * Retrieves modules registered by type in the namespace of an Application or
 * Engine.
 *
 * This resolution process is inefficient and should be revisited when more
 * discovery capabilities are added to the ember-resolver.
 */
export default function (prefix: string, type: string): string[] {
  const regex = new RegExp(`^${prefix}/${type}/?/`);
  const moduleNames = Object.keys((self as any).requirejs._eak_seen);
  const found: string[] = [];

  for (const moduleName of moduleNames) {
    const matches = regex.exec(moduleName);
    if (matches && matches.length === 1) {
      const matchedName = moduleName.match(/[^\/]+\/?$/);
      if (matchedName?.[0]) {
        found.push(matchedName[0]);
      }
    }
  }

  return found;
}
