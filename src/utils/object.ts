export function mergeObjects(...args: { [key: string]: any }[]) {
  return Object.assign({}, ...args);
}
