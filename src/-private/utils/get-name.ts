export function getName(path: string) {
  if (path.includes('.')) {
    return path.substring(0, path.lastIndexOf('.'));
  }

  return path;
}
