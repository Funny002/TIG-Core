// TODO: 对象合并
export function mergeObjects(...args: { [key: string]: any }[]) {
  return Object.assign({}, ...args);
}
